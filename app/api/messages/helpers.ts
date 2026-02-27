// =============================================================================
// API — Helpers pour les routes messages
// =============================================================================

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MessageService } from "@/services/message-service";

/**
 * Récupère l'utilisateur authentifié et crée le MessageService.
 */
export async function withMessageAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, service: null };
  }

  const service = new MessageService(supabase);

  return { user, service };
}
