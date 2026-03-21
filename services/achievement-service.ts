// =============================================================================
// SERVICE — Achievement Service
// =============================================================================
// Gère la vérification et le déblocage des achievements après une partie.
// Orchestre : état du jeu → vérification des conditions → mise à jour DB.
// =============================================================================

import type { GameState, ChallengeResult } from "@/core/game-engine/types";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  detectPacoOnlyChallenge,
  type AchievementContext,
} from "@/core/achievements";
import type { UserAchievement } from "@/types/api";
import { AchievementRepository } from "@/lib/database/achievement-repository";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { NotificationRepository } from "@/lib/database/notification-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export class AchievementService {
  private readonly achievements: AchievementRepository;
  private readonly profiles: ProfileRepository;
  private readonly notificationRepo: NotificationRepository;

  constructor() {
    const adminClient = getSupabaseAdminClient();
    this.achievements = new AchievementRepository(adminClient);
    this.profiles = new ProfileRepository(adminClient);
    this.notificationRepo = new NotificationRepository(adminClient);
  }

  // ===========================================================================
  // Vérification et déblocage — appelé au GAME_OVER
  // ===========================================================================

  /**
   * Vérifie tous les achievements pour tous les joueurs de la partie.
   * Retourne les achievements nouvellement débloqués par joueur.
   */
  async checkAndUnlock(
    state: GameState,
    challengeResult: ChallengeResult | null,
  ): Promise<Map<string, string[]>> {
    const newlyUnlocked = new Map<string, string[]>();

    // Détecter si le dernier challenge était un "Paco only"
    const isPacoOnly =
      challengeResult != null &&
      detectPacoOnlyChallenge(challengeResult, state.config.pacosAreWild);

    const winner = state.players.find((p) => p.id === state.winnerId);

    for (const player of state.players) {
      const profile = await this.profiles.findById(player.id);
      if (!profile) continue;

      // Construire le contexte d'évaluation
      const ctx: AchievementContext = {
        playerId: player.id,
        isWinner: player.id === state.winnerId,
        totalGamesPlayed: profile.games_played,
        maxElo: Math.max(profile.elo_1v1, profile.elo_4p),
        winnerDiceCount: winner?.diceCount ?? 0,
        initialDiceCount: state.config.initialDiceCount,
        consecutiveBluffWins: profile.consecutive_bluff_wins,
        // Paco King : uniquement pour le caller du challenge
        wonPacoOnlyChallenge:
          isPacoOnly && challengeResult!.callerId === player.id,
      };

      // Charger les achievements existants du joueur
      const existing = await this.achievements.findByUserId(player.id);
      const unlockedSet = new Set(
        existing.filter((a) => a.unlocked_at != null).map((a) => a.achievement_id),
      );

      const playerNewUnlocks: string[] = [];

      for (const achievementId of ACHIEVEMENT_IDS) {
        // Déjà débloqué → juste mettre à jour la progression
        if (unlockedSet.has(achievementId)) continue;

        const def = ACHIEVEMENTS[achievementId];
        const progress = def.getProgress(ctx);
        const isUnlocked = def.check(ctx);

        // Mettre à jour la progression
        await this.achievements.upsertProgress(
          player.id,
          achievementId,
          { value: progress },
          isUnlocked,
        );

        if (isUnlocked) {
          playerNewUnlocks.push(achievementId);

          // Envoyer une notification
          await this.notificationRepo
            .create(
              player.id,
              "achievement_unlocked",
              `Achievement unlocked: ${def.name}!`,
              def.description,
              { achievementId: def.id, icon: def.icon },
            )
            .catch((e) =>
              console.error("[Achievements] notification failed:", e),
            );
        }
      }

      if (playerNewUnlocks.length > 0) {
        newlyUnlocked.set(player.id, playerNewUnlocks);
      }
    }

    return newlyUnlocked;
  }

  // ===========================================================================
  // Lecture — pour les API routes
  // ===========================================================================

  /**
   * Retourne tous les achievements avec la progression du joueur.
   */
  async getPlayerAchievements(userId: string): Promise<UserAchievement[]> {
    const rows = await this.achievements.findByUserId(userId);
    const rowMap = new Map(rows.map((r) => [r.achievement_id, r]));

    return ACHIEVEMENT_IDS.map((id) => {
      const def = ACHIEVEMENTS[id];
      const row = rowMap.get(id);
      const progress = row?.progress as { value?: number } | undefined;

      return {
        achievementId: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        currentValue: (progress?.value as number) ?? 0,
        maxValue: def.maxProgress,
        isUnlocked: row?.unlocked_at != null,
        unlockedAt: row?.unlocked_at ?? null,
      };
    });
  }

  /**
   * Retourne uniquement les achievements débloqués d'un joueur (profil public).
   */
  async getUnlockedAchievements(userId: string): Promise<UserAchievement[]> {
    const rows = await this.achievements.findUnlockedByUserId(userId);

    return rows
      .filter((r) => ACHIEVEMENTS[r.achievement_id] != null)
      .map((r) => {
        const def = ACHIEVEMENTS[r.achievement_id];
        return {
          achievementId: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          currentValue: def.maxProgress,
          maxValue: def.maxProgress,
          isUnlocked: true,
          unlockedAt: r.unlocked_at,
        };
      });
  }
}
