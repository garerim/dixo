// =============================================================================
// API — Helpers pour les routes matchmaking
// =============================================================================

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MatchmakingService } from "@/services/matchmaking-service";

/**
 * Récupère l'utilisateur authentifié et crée le MatchmakingService.
 */
export async function withMatchmakingAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, service: null };
  }

  const service = new MatchmakingService(supabase);

  return { user, service };
}
