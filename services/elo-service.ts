// =============================================================================
// SERVICE — ELO Service
// =============================================================================
// Gère le calcul et l'application des changements ELO après une partie RANKED.
// Orchestre : game engine résultat → calcul ELO → mise à jour profils.
// =============================================================================

import type { EloChangeInfo } from "@/types/api";
import type { GameState } from "@/core/game-engine";
import { GameMode } from "@/core/game-engine";
import {
  calculateMultiplayerElo,
  buildPlacements,
  type EloPlayer,
} from "@/core/elo";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { EloHistoryRepository } from "@/lib/database/elo-history-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export class EloService {
  private readonly profiles: ProfileRepository;
  private readonly eloHistory: EloHistoryRepository;

  constructor() {
    // Utilise le client admin (service role) pour contourner la RLS.
    // Nécessaire car on met à jour les stats de TOUS les joueurs,
    // pas seulement celui qui est authentifié.
    const adminClient = getSupabaseAdminClient();
    this.profiles = new ProfileRepository(adminClient);
    this.eloHistory = new EloHistoryRepository(adminClient);
  }

  /**
   * Applique les changements ELO après une partie terminée.
   * Ne fait rien si la partie n'est pas en mode RANKED.
   *
   * @param state - État final du jeu (phase GAME_OVER)
   * @param eliminationOrder - IDs des joueurs éliminés dans l'ordre
   * @returns Changements ELO ou null si pas RANKED
   */
  async applyEloChanges(
    state: GameState,
    eliminationOrder: string[],
  ): Promise<EloChangeInfo[] | null> {
    // Ne rien faire si pas en RANKED
    if (state.gameMode !== GameMode.RANKED) {
      return null;
    }

    if (!state.winnerId) {
      return null;
    }

    // Déterminer le mode ELO en fonction du nombre de joueurs
    const isOneVOne = state.config.maxPlayers <= 2;
    const rankedMode = isOneVOne ? "1v1" : "4p";

    // Récupérer les profils de tous les joueurs
    const profiles = await Promise.all(
      state.players.map((p) => this.profiles.findById(p.id)),
    );

    // Construire les placements
    const placements = buildPlacements(eliminationOrder, state.winnerId);

    // Construire la liste des joueurs pour le calcul ELO
    const eloPlayers: EloPlayer[] = [];
    const gamesPlayedMap = new Map<string, number>();

    for (const player of state.players) {
      const profile = profiles.find((p) => p?.id === player.id);
      if (!profile) continue;

      const placement = placements.get(player.id);
      if (placement === undefined) continue;

      // Utiliser l'ELO du mode correspondant
      const playerElo = isOneVOne ? profile.elo_1v1 : profile.elo_4p;

      eloPlayers.push({
        id: player.id,
        elo: playerElo,
        placement,
      });

      gamesPlayedMap.set(player.id, profile.games_played);
    }

    // Calculer les changements ELO
    const changes = calculateMultiplayerElo(eloPlayers, gamesPlayedMap);

    // Appliquer les changements à chaque profil
    for (const change of changes) {
      const isWinner = change.playerId === state.winnerId;
      const profile = profiles.find((p) => p?.id === change.playerId);

      if (!profile) continue;

      const newWinStreak = isWinner
        ? profile.current_win_streak + 1
        : 0;
      const newBestStreak = Math.max(profile.best_win_streak, newWinStreak);

      // Mettre à jour l'ELO du mode correspondant
      const eloUpdate = isOneVOne
        ? { elo1v1: change.newElo }
        : { elo4p: change.newElo };

      await this.profiles.updateStats(change.playerId, {
        ...eloUpdate,
        gamesPlayed: profile.games_played + 1,
        gamesWon: isWinner ? profile.games_won + 1 : profile.games_won,
        currentWinStreak: newWinStreak,
        bestWinStreak: newBestStreak,
      });

      // Enregistrer dans l'historique ELO avec le mode
      await this.eloHistory.insert({
        userId: change.playerId,
        elo: change.newElo,
        delta: change.delta,
        gameId: state.id,
        rankedMode,
      });
    }

    // Retourner les changements pour le frontend
    return changes.map((c) => ({
      playerId: c.playerId,
      oldElo: c.oldElo,
      newElo: c.newElo,
      delta: c.delta,
    }));
  }

  /**
   * Met à jour les stats post-partie pour les modes NON-RANKED.
   * Incrémente juste le compteur de parties jouées/gagnées.
   */
  async updateStatsNonRanked(state: GameState): Promise<void> {
    if (state.gameMode === GameMode.RANKED) return;

    for (const player of state.players) {
      const profile = await this.profiles.findById(player.id);
      if (!profile) continue;

      const isWinner = player.id === state.winnerId;

      await this.profiles.updateStats(player.id, {
        gamesPlayed: profile.games_played + 1,
        gamesWon: isWinner ? profile.games_won + 1 : profile.games_won,
      });
    }
  }
}
