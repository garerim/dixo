// =============================================================================
// SERVICE — Matchmaking Service (Orchestration)
// =============================================================================
// Gère la file d'attente et le pairing des joueurs.
// Orchestre : validation → queue → logique matchmaking → création de partie.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameModeDB } from "@/types/database";
import type { QueueStatus } from "@/types/api";
import {
  createInitialGameState,
  addPlayer,
  startGame,
  GameMode,
} from "@/core/game-engine";
import {
  findMatch,
  type QueueEntry,
  DEFAULT_MATCHMAKING_CONFIG,
} from "@/core/elo";
import { MatchmakingRepository } from "@/lib/database/matchmaking-repository";
import { GameRepository } from "@/lib/database/game-repository";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { NotificationService } from "@/services/notification-service";

// =============================================================================
// Types
// =============================================================================

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Service
// =============================================================================

export class MatchmakingService {
  private readonly queue: MatchmakingRepository;
  private readonly games: GameRepository;
  private readonly profiles: ProfileRepository;
  private readonly supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.queue = new MatchmakingRepository(supabase);
    this.games = new GameRepository(supabase);
    this.profiles = new ProfileRepository(supabase);
  }

  // ===========================================================================
  // Rejoindre la file d'attente
  // ===========================================================================

  async joinQueue(
    userId: string,
    displayName: string,
    gameMode: "NORMAL" | "RANKED",
    playerCount: number = 2,
  ): Promise<ServiceResult<{ entryId: string }>> {
    try {
      // Récupérer le profil pour l'ELO
      const profile = await this.profiles.findById(userId);
      if (!profile) {
        return { success: false, error: "Profil non trouvé." };
      }

      // Vérifier que le joueur n'est pas déjà en file
      const existing = await this.queue.findWaitingByUserId(userId);
      if (existing) {
        return {
          success: false,
          error: "You are already in the queue.",
        };
      }

      // Utiliser l'ELO correspondant au mode
      const elo = playerCount <= 2 ? profile.elo_1v1 : profile.elo_4p;

      // Ajouter à la file
      const entry = await this.queue.enqueue(
        userId,
        elo,
        gameMode as GameModeDB,
        playerCount,
      );

      // Tenter un match immédiatement
      await this.tryMatch(gameMode as GameModeDB, playerCount);

      return { success: true, data: { entryId: entry.id } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Quitter la file d'attente
  // ===========================================================================

  async leaveQueue(
    userId: string,
    entryId: string,
  ): Promise<ServiceResult<void>> {
    try {
      await this.queue.cancel(entryId, userId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Statut de la file d'attente
  // ===========================================================================

  async getQueueStatus(
    userId: string,
  ): Promise<ServiceResult<QueueStatus>> {
    try {
      // Chercher une entrée active (waiting OU matched)
      const entry = await this.queue.findActiveByUserId(userId);

      if (!entry) {
        return { success: false, error: "You are not in the queue." };
      }

      // Si l'entrée est en attente, tenter un match (au cas où)
      if (entry.status === "waiting") {
        const gameId = await this.tryMatch(
          entry.game_mode as GameModeDB,
          entry.player_count,
        );
        if (gameId) {
          // Le match vient d'être trouvé — recharger l'entrée
          const refreshed = await this.queue.findById(entry.id);
          if (refreshed && refreshed.status === "matched") {
            return {
              success: true,
              data: {
                entryId: refreshed.id,
                status: "matched",
                elo: refreshed.elo,
                gameMode: refreshed.game_mode as "NORMAL" | "RANKED",
                playerCount: refreshed.player_count as 2 | 4,
                matchedGameId: refreshed.matched_game_id,
                waitTimeSeconds: Math.floor(
                  (Date.now() - new Date(refreshed.joined_at).getTime()) / 1000,
                ),
                playersInQueue: 0,
              },
            };
          }
        }
      }

      // Calculer le temps d'attente
      const waitTimeSeconds = Math.floor(
        (Date.now() - new Date(entry.joined_at).getTime()) / 1000,
      );

      // Compter les joueurs dans la file (même mode + même playerCount)
      const playersInQueue = entry.status === "waiting"
        ? await this.queue.countWaiting(
            entry.game_mode as GameModeDB,
            entry.player_count,
          )
        : 0;

      return {
        success: true,
        data: {
          entryId: entry.id,
          status: entry.status as "waiting" | "matched" | "cancelled",
          elo: entry.elo,
          gameMode: entry.game_mode as "NORMAL" | "RANKED",
          playerCount: entry.player_count as 2 | 4,
          matchedGameId: entry.matched_game_id,
          waitTimeSeconds,
          playersInQueue,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Tenter un match (appelé après chaque ajout à la file)
  // ===========================================================================

  async tryMatch(
    gameMode: GameModeDB,
    playerCount: number = 2,
  ): Promise<string | null> {
    try {
      // Récupérer tous les joueurs en attente (même mode + même playerCount)
      const waitingEntries = await this.queue.getWaitingEntries(
        gameMode,
        playerCount,
      );

      // Configuration de matchmaking adaptée au nombre de joueurs
      const matchConfig = {
        ...DEFAULT_MATCHMAKING_CONFIG,
        playersPerMatch: playerCount,
      };

      if (waitingEntries.length < matchConfig.playersPerMatch) {
        return null;
      }

      // Convertir en QueueEntry pour le domaine
      const queueEntries: QueueEntry[] = waitingEntries.map((e) => ({
        userId: e.user_id,
        elo: e.elo,
        joinedAt: e.joined_at,
      }));

      // Chercher un match
      const now = new Date();
      const match = findMatch(queueEntries, now, matchConfig);

      if (!match) {
        return null;
      }

      // Match trouvé → créer la partie
      const engineMode = gameMode === "RANKED" ? GameMode.RANKED : GameMode.NORMAL;
      const gameId = crypto.randomUUID();

      // Le premier joueur est l'hôte
      const hostEntry = match.players[0];
      const hostProfile = await this.profiles.findById(hostEntry.userId);

      if (!hostProfile) {
        return null;
      }

      // Configuration de la partie : exactement playerCount joueurs
      const gameConfig = {
        minPlayers: playerCount,
        maxPlayers: playerCount,
        initialDiceCount: 5,
        pacosAreWild: true,
        turnTimer: null,
      };

      let gameState = createInitialGameState(
        gameId,
        {
          id: hostEntry.userId,
          displayName: hostProfile.pseudo,
          avatarUrl: hostProfile.avatar_url ?? undefined,
        },
        engineMode,
        gameConfig,
      );

      // Ajouter les autres joueurs
      for (let i = 1; i < match.players.length; i++) {
        const playerEntry = match.players[i];
        const playerProfile = await this.profiles.findById(playerEntry.userId);

        if (!playerProfile) continue;

        const result = addPlayer(gameState, {
          id: playerEntry.userId,
          displayName: playerProfile.pseudo,
          avatarUrl: playerProfile.avatar_url ?? undefined,
          subscription: playerProfile.subscription ?? "free",
          diceSkin: playerProfile.dice_skin ?? undefined,
        });

        if (result.success) {
          gameState = result.state;
        }
      }

      // Auto-démarrer la partie (les joueurs sont directement en jeu)
      const hostId = hostEntry.userId;
      const startResult = startGame(gameState, hostId);
      if (startResult.success) {
        gameState = startResult.state;
      }

      // Sauvegarder la partie
      await this.games.create(gameState);

      // Marquer les entrées comme matchées
      const matchedUserIds = match.players.map((p) => p.userId);
      const matchedEntryIds = waitingEntries
        .filter((e) => matchedUserIds.includes(e.user_id))
        .map((e) => e.id);

      await this.queue.markAsMatched(matchedEntryIds, gameId);

      // Notify all matched players that the game is starting
      for (const player of match.players) {
        NotificationService.notifyGameStarted(
          this.supabase,
          player.userId,
          gameId,
        ).catch(() => {});
      }

      return gameId;
    } catch (error) {
      console.error("Erreur matchmaking:", error);
      return null;
    }
  }
}
