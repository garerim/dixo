// =============================================================================
// API — GET /api/profile/search?q=xxx — Recherche de profils
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withProfileAuth } from "../helpers";

export async function GET(request: Request) {
  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? "10", 10),
    50,
  );

  if (query.length < 2) {
    return errorResponse("Search must contain at least 2 characters.", 400);
  }

  const result = await service.searchProfiles(query, limit);

  if (!result.success) {
    return errorResponse(result.error ?? "Error during search.", 500);
  }

  return successResponse(result.data);
}
