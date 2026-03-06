// =============================================================================
// API — Helpers pour les routes admin
// =============================================================================

import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Vérifie que l'utilisateur authentifié est admin.
 * Retourne user + adminClient si OK, null sinon.
 */
export async function withAdminAuth() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return { user: null, adminClient: null };

  const adminClient = getSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { user: null, adminClient: null };

  return { user, adminClient };
}
