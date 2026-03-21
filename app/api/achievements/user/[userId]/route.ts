// =============================================================================
// API — GET /api/achievements/user/[userId] — Achievements débloqués (profil public)
// =============================================================================

import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { AchievementService } from "@/services/achievement-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  if (!userId) {
    return errorResponse("Missing userId.", 400);
  }

  try {
    const service = new AchievementService();
    const achievements = await service.getUnlockedAchievements(userId);
    return successResponse(achievements);
  } catch {
    return errorResponse("Unable to load achievements.", 500);
  }
}
