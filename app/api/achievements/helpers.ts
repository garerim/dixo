// =============================================================================
// API — Helpers pour les routes achievements
// =============================================================================

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AchievementService } from "@/services/achievement-service";
import type { User } from "@supabase/supabase-js";

/**
 * Récupère l'utilisateur authentifié et crée le AchievementService.
 */
export async function withAchievementAuth(): Promise<{
  user: User | null;
  service: AchievementService | null;
}> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, service: null };
  }

  const service = new AchievementService();

  return { user, service };
}
