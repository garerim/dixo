// =============================================================================
// API — Helpers pour les routes notifications
// =============================================================================

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NotificationService } from "@/services/notification-service";

/**
 * Récupère l'utilisateur authentifié et crée le NotificationService.
 */
export async function withNotificationAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, service: null };
  }

  const service = new NotificationService(supabase);

  return { user, service };
}
