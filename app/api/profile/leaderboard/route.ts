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
  const modeParam = searchParams.get("mode");
  const mode: "1v1" | "4p" = modeParam === "4p" ? "4p" : "1v1";

  const result = await service.getLeaderboard(limit, mode);

  if (!result.success) {
    return errorResponse(result.error ?? "Error loading leaderboard.", 500);
  }

  return successResponse(result.data);
}
