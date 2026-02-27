// =============================================================================
// INFRASTRUCTURE — Client Supabase (côté serveur)
// =============================================================================
// Client pour les Server Components, Route Handlers et Server Actions.
// Crée un nouveau client à chaque requête (pas de singleton côté serveur).
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Crée un client Supabase côté serveur avec accès aux cookies.
 * À utiliser dans les Route Handlers et Server Actions.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll peut échouer dans les Server Components (read-only).
            // C'est normal : les cookies seront définis via le middleware.
          }
        },
      },
    },
  );
}

/**
 * Crée un client Supabase avec le Service Role Key.
 * Contourne la RLS — À UTILISER UNIQUEMENT côté serveur pour les opérations
 * admin (mise à jour des stats, ELO, etc.).
 *
 * ⚠️ Ne JAMAIS exposer ce client côté client !
 */
export function getSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante. Ajoutez-la dans .env.local.",
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Récupère l'utilisateur authentifié courant.
 * Retourne null si non authentifié.
 */
export async function getAuthenticatedUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
