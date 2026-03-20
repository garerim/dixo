// =============================================================================
// API — GET /api/notifications/list — Récupérer les notifications
// =============================================================================

import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withNotificationAuth } from "../helpers";

export async function GET(request: NextRequest) {
  const { user, service } = await withNotificationAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 30));

  const result = await service.getNotifications(user.id, page, limit);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to load notifications.", 400);
  }

  return successResponse(result.data);
}
