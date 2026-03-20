// =============================================================================
// API — POST /api/notifications/read-all — Marquer toutes les notifications comme lues
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withNotificationAuth } from "../helpers";

export async function POST() {
  const { user, service } = await withNotificationAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const result = await service.markAllAsRead(user.id);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to mark all as read.", 400);
  }

  return successResponse(undefined);
}
