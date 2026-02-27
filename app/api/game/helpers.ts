// =============================================================================
// API — Helpers partagés pour les route handlers
// =============================================================================
// Fonctions utilitaires pour l'authentification et la validation.
// Évite la duplication de code entre les différents endpoints.
// =============================================================================

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GameService } from "@/services/game-service";
import type { ApiResponse } from "@/types/api";

/**
 * Crée une réponse JSON d'erreur standardisée.
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiResponse,
    { status },
  );
}

/**
 * Crée une réponse JSON de succès standardisée.
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data } satisfies ApiResponse<T>,
    { status },
  );
}

/**
 * Récupère l'utilisateur authentifié et crée le GameService.
 * Retourne une erreur 401 si non authentifié.
 */
export async function withAuth() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, service: null, supabase: null };
  }

  const service = new GameService(supabase);

  return { user, service, supabase };
}
