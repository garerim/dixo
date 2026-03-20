// =============================================================================
// API — GET /api/notifications/unread-count — Nombre de notifications non lues
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withNotificationAuth } from "../helpers";

export async function GET() {
  const { user, service } = await withNotificationAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const result = await service.getUnreadCount(user.id);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to load unread count.", 400);
  }

  return successResponse(result.data);
}
