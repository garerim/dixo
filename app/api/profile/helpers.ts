// =============================================================================
// API — Helpers pour les routes profil
// =============================================================================

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileService } from "@/services/profile-service";

/**
 * Récupère l'utilisateur authentifié et crée le ProfileService.
 */
export async function withProfileAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, service: null };
  }

  const service = new ProfileService(supabase);

  return { user, service };
}
