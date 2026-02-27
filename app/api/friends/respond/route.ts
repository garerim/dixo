// =============================================================================
// API — POST /api/friends/respond — Répondre à une demande d'amitié
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withFriendshipAuth } from "../helpers";

const RespondSchema = z.object({
  friendshipId: z.string().uuid(),
  accept: z.boolean(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withFriendshipAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = RespondSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Données invalides. friendshipId et accept requis.");
  }

  const result = await service.respondToRequest(
    user.id,
    parsed.data.friendshipId,
    parsed.data.accept,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Impossible de répondre à la demande.", 400);
  }

  return successResponse(undefined);
}
