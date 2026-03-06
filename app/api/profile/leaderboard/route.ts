// =============================================================================
// API — GET /api/profile/leaderboard — Classement ELO
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withProfileAuth } from "../helpers";

export async function GET(request: Request) {
  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    parseInt(searchParams.get("limit") ?? "50", 10),
    100,
  );

  const result = await service.getLeaderboard(limit);

  if (!result.success) {
    return errorResponse(result.error ?? "Error loading leaderboard.", 500);
  }

  return successResponse(result.data);
}
