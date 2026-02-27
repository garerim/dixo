// =============================================================================
// INFRASTRUCTURE — Client Supabase (côté navigateur)
// =============================================================================
// Client singleton pour le navigateur. Utilisé par les hooks et les composants.
// =============================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Retourne un client Supabase pour le navigateur (singleton).
 * Utilise @supabase/ssr pour la gestion des cookies automatique.
 */
export function getSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return client;
}
