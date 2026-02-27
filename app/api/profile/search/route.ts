// =============================================================================
// API — GET /api/profile/search?q=xxx — Recherche de profils
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withProfileAuth } from "../helpers";

export async function GET(request: Request) {
  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? "10", 10),
    50,
  );

  if (query.length < 2) {
    return errorResponse("La recherche doit contenir au moins 2 caractères.", 400);
  }

  const result = await service.searchProfiles(query, limit);

  if (!result.success) {
    return errorResponse(result.error ?? "Erreur lors de la recherche.", 500);
  }

  return successResponse(result.data);
}
