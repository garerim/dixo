// =============================================================================
// PAGE — /admin — Panneau d'administration des signalements
// =============================================================================

import { redirect } from "next/navigation";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminReportsPanel } from "./admin-reports-panel";

export default async function AdminPage() {
  // Check auth
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/");

  // Check is_admin via admin client
  const adminClient = getSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return <AdminReportsPanel />;
}
