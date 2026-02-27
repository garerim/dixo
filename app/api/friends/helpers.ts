// =============================================================================
// API — Helpers pour les routes amis
// =============================================================================

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { FriendshipService } from "@/services/friendship-service";

/**
 * Récupère l'utilisateur authentifié et crée le FriendshipService.
 */
export async function withFriendshipAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, service: null };
  }

  const service = new FriendshipService(supabase);

  return { user, service };
}
