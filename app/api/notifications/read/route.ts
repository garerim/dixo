// =============================================================================
// API — POST /api/notifications/read — Marquer une notification comme lue
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withNotificationAuth } from "../helpers";

const ReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withNotificationAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = ReadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data. notificationId required.");
  }

  const result = await service.markAsRead(parsed.data.notificationId);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to mark notification as read.", 400);
  }

  return successResponse(undefined);
}
