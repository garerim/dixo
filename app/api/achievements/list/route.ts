// =============================================================================
// API — GET /api/achievements/list — Achievements du joueur connecté
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withAchievementAuth } from "../helpers";

export async function GET() {
  const { user, service } = await withAchievementAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  try {
    const achievements = await service.getPlayerAchievements(user.id);
    return successResponse(achievements);
  } catch {
    return errorResponse("Unable to load achievements.", 500);
  }
}
