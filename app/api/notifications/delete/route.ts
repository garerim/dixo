// =============================================================================
// API — POST /api/notifications/delete — Supprimer une notification
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withNotificationAuth } from "../helpers";

const Schema = z.object({
  notificationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withNotificationAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid notificationId.");
  }

  const result = await service.delete(parsed.data.notificationId);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to delete notification.", 400);
  }

  return successResponse(undefined);
}
