// =============================================================================
// API — POST /api/messages/read — Marquer les messages comme lus
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withMessageAuth } from "../helpers";

const MarkReadSchema = z.object({
  friendId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withMessageAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = MarkReadSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Données invalides. friendId requis.");
  }

  const result = await service.markAsRead(user.id, parsed.data.friendId);

  if (!result.success) {
    return errorResponse(result.error ?? "Impossible de marquer les messages comme lus.", 400);
  }

  return successResponse(undefined);
}
