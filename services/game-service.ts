// =============================================================================
// SERVICE — Game Service (Orchestration)
// =============================================================================
// Couche application qui orchestre :
// 1. Chargement de l'état depuis la base de données
// 2. Appel du game engine (logique pure)
// 3. Sauvegarde du nouvel état
// 4. Gestion des erreurs
//
// AUCUNE logique métier ici — tout est délégué au game engine.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PublicGameState } from "@/types/api";
import {
  createInitialGameState,
  addPlayer,
  removePlayer,
  updateSettings,
  startGame,
  placeBid,
  callChallenge,
  startNextRound,
  surrender,
  GameMode,
  GamePhase,
  type GameState,
} from "@/core/game-engine";
import { GameRepository } from "@/lib/database/game-repository";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { EloService } from "./elo-service";
import { sanitizeGameStateForPlayer } from "./game-state-sanitizer";

// =============================================================================
// Types de résultats
// =============================================================================

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Game Service
// =============================================================================

export class GameService {
  private readonly repository: GameRepository;
  private readonly profileRepository: ProfileRepository;
  private readonly eloService: EloService;
  /** Tracking de l'ordre d'élimination pour le calcul ELO (en mémoire par partie) */
  private static eliminationOrders = new Map<string, string[]>();

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new GameRepository(supabase);
    this.profileRepository = new ProfileRepository(supabase);
    this.eloService = new EloService();
  }

  // ===========================================================================
  // Créer une partie
  // ===========================================================================

  async createGame(
    userId: string,
    displayName: string,
    gameMode: GameMode = GameMode.PRIVATE,
  ): Promise<ServiceResult<{ gameId: string; joinCode: string }>> {
    try {
      const profile = await this.profileRepository.findById(userId);
      const gameId = generateGameId();
      const initialState = createInitialGameState(
        gameId,
        {
          id: userId,
          displayName,
          avatarUrl: profile?.avatar_url ?? undefined,
          subscription: profile?.subscription ?? "free",
          diceSkin: profile?.dice_skin ?? undefined,
        },
        gameMode,
      );

      await this.repository.create(initialState);

      return {
        success: true,
        data: { gameId: initialState.id, joinCode: initialState.joinCode },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Rejoindre une partie
  // ===========================================================================

  async joinGame(
    userId: string,
    displayName: string,
    joinCode: string,
  ): Promise<ServiceResult<{ gameId: string }>> {
    try {
      const state = await this.repository.findByJoinCode(joinCode);
      if (!state) {
        return { success: false, error: "Game not found." };
      }

      const profile = await this.profileRepository.findById(userId);
      const result = addPlayer(state, {
        id: userId,
        displayName,
        avatarUrl: profile?.avatar_url ?? undefined,
        subscription: profile?.subscription ?? "free",
        diceSkin: profile?.dice_skin ?? undefined,
      });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      await this.repository.update(result.state);

      return { success: true, data: { gameId: result.state.id } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Quitter une partie (LOBBY uniquement)
  // ===========================================================================

  async leaveGame(
    userId: string,
    gameId: string,
  ): Promise<ServiceResult<void>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) return { success: false, error: "Game not found." };

      const result = removePlayer(state, userId);
      if (!result.success) return { success: false, error: result.error };

      await this.repository.update(result.state);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Modifier les paramètres
  // ===========================================================================

  async updateSettings(
    userId: string,
    gameId: string,
    settings: {
      initialDiceCount?: number;
      pacosAreWild?: boolean;
      turnTimer?: number | null;
      maxPlayers?: number;
    },
  ): Promise<ServiceResult<PublicGameState>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) return { success: false, error: "Game not found." };

      const result = updateSettings(state, userId, settings);
      if (!result.success) return { success: false, error: result.error };

      await this.repository.update(result.state);

      return {
        success: true,
        data: sanitizeGameStateForPlayer(result.state, userId),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Démarrer la partie
  // ===========================================================================

  async startGame(
    userId: string,
    gameId: string,
  ): Promise<ServiceResult<PublicGameState>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) {
        return { success: false, error: "Game not found." };
      }

      const result = startGame(state, userId);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      await this.repository.update(result.state);

      return {
        success: true,
        data: sanitizeGameStateForPlayer(result.state, userId),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Placer une enchère
  // ===========================================================================

  async placeBid(
    userId: string,
    gameId: string,
    quantity: number,
    faceValue: number,
  ): Promise<ServiceResult<PublicGameState>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) {
        return { success: false, error: "Game not found." };
      }

      const result = placeBid(state, {
        playerId: userId,
        quantity,
        faceValue,
      });
      if (!result.success) {
        return { success: false, error: result.error };
      }

      await this.repository.update(result.state);

      return {
        success: true,
        data: sanitizeGameStateForPlayer(result.state, userId),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Contester l'enchère (Challenge)
  // ===========================================================================

  async callChallenge(
    userId: string,
    gameId: string,
  ): Promise<ServiceResult<PublicGameState>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) {
        return { success: false, error: "Game not found." };
      }

      // Joueurs vivants AVANT le challenge
      const aliveBefore = state.players.filter((p) => p.isAlive).map((p) => p.id);

      const result = callChallenge(state, userId);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Joueurs vivants APRÈS le challenge — détecter les éliminations
      const aliveAfter = result.state.players.filter((p) => p.isAlive).map((p) => p.id);
      const eliminated = aliveBefore.filter((id) => !aliveAfter.includes(id));

      // Tracker l'ordre d'élimination
      if (eliminated.length > 0) {
        const order = GameService.eliminationOrders.get(gameId) ?? [];
        order.push(...eliminated);
        GameService.eliminationOrders.set(gameId, order);
      }

      // Si la partie est terminée → appliquer ELO + stats
      const sanitized = sanitizeGameStateForPlayer(result.state, userId);

      if (result.state.phase === GamePhase.GAME_OVER) {
        const eliminationOrder = GameService.eliminationOrders.get(gameId) ?? [];

        // Appliquer les changements ELO (uniquement RANKED)
        const eloChanges = await this.eloService.applyEloChanges(
          result.state,
          eliminationOrder,
        );

        // Mettre à jour les stats si pas RANKED
        if (!eloChanges) {
          await this.eloService.updateStatsNonRanked(result.state);
        }

        // Nettoyage mémoire
        GameService.eliminationOrders.delete(gameId);

        // Ajouter les changements ELO à la réponse
        if (eloChanges) {
          sanitized.eloChanges = eloChanges;
        }
      }

      await this.repository.update(result.state);

      return { success: true, data: sanitized };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Prochain round
  // ===========================================================================

  async nextRound(
    userId: string,
    gameId: string,
  ): Promise<ServiceResult<PublicGameState>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) {
        return { success: false, error: "Game not found." };
      }

      const result = startNextRound(state);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      await this.repository.update(result.state);

      return {
        success: true,
        data: sanitizeGameStateForPlayer(result.state, userId),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Abandonner la partie
  // ===========================================================================

  async surrenderGame(
    userId: string,
    gameId: string,
  ): Promise<ServiceResult<PublicGameState>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) {
        return { success: false, error: "Game not found." };
      }

      const result = surrender(state, userId);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Sauvegarder l'état AVANT les stats (pour que l'adversaire voie le résultat)
      await this.repository.update(result.state);

      const sanitized = sanitizeGameStateForPlayer(result.state, userId);

      // Si la partie est terminée → appliquer ELO + stats
      if (result.state.phase === GamePhase.GAME_OVER) {
        try {
          // Le joueur qui abandonne est considéré comme éliminé
          const eliminationOrder = GameService.eliminationOrders.get(gameId) ?? [];
          eliminationOrder.push(userId);
          GameService.eliminationOrders.set(gameId, eliminationOrder);

          const eloChanges = await this.eloService.applyEloChanges(
            result.state,
            eliminationOrder,
          );

          if (!eloChanges) {
            await this.eloService.updateStatsNonRanked(result.state);
          }

          GameService.eliminationOrders.delete(gameId);

          if (eloChanges) {
            sanitized.eloChanges = eloChanges;
          }
        } catch (statsError) {
          console.error("Erreur mise à jour des stats après abandon:", statsError);
          // On ne bloque pas l'abandon si les stats échouent
        }
      }

      return { success: true, data: sanitized };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Récupérer l'état du jeu
  // ===========================================================================

  async getGameState(
    userId: string,
    gameId: string,
  ): Promise<ServiceResult<PublicGameState>> {
    try {
      const state = await this.loadGame(gameId);
      if (!state) {
        return { success: false, error: "Game not found." };
      }

      // Vérifier que le joueur fait partie de la partie
      const isPlayer = state.players.some((p) => p.id === userId);
      if (!isPlayer) {
        return { success: false, error: "You are not part of this game." };
      }

      return {
        success: true,
        data: sanitizeGameStateForPlayer(state, userId),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Helpers privés
  // ===========================================================================

  private async loadGame(gameId: string): Promise<GameState | null> {
    return this.repository.findById(gameId);
  }
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Génère un ID de partie unique.
 */
function generateGameId(): string {
  return crypto.randomUUID();
}
