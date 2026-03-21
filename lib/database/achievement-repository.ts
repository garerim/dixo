// =============================================================================
// INFRASTRUCTURE — Achievement Repository
// =============================================================================
// Couche d'accès aux données pour les achievements utilisateur.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserAchievementRow } from "@/types/database";

export class AchievementRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Récupère tous les achievements d'un utilisateur.
   */
  async findByUserId(userId: string): Promise<UserAchievementRow[]> {
    const { data, error } = await this.supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId);

    if (error || !data) return [];
    return data;
  }

  /**
   * Récupère un achievement spécifique d'un utilisateur.
   */
  async findByUserAndAchievement(
    userId: string,
    achievementId: string,
  ): Promise<UserAchievementRow | null> {
    const { data, error } = await this.supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  /**
   * Crée ou met à jour la progression d'un achievement.
   */
  async upsertProgress(
    userId: string,
    achievementId: string,
    progress: Record<string, unknown>,
    unlocked: boolean,
  ): Promise<UserAchievementRow> {
    const { data, error } = await this.supabase
      .from("user_achievements")
      .upsert(
        {
          user_id: userId,
          achievement_id: achievementId,
          progress,
          unlocked_at: unlocked ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,achievement_id" },
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Erreur upsert achievement: ${error?.message ?? "Données manquantes"}`);
    }

    return data;
  }

  /**
   * Récupère les achievements débloqués d'un utilisateur (pour le profil public).
   */
  async findUnlockedByUserId(userId: string): Promise<UserAchievementRow[]> {
    const { data, error } = await this.supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .not("unlocked_at", "is", null);

    if (error || !data) return [];
    return data;
  }
}
