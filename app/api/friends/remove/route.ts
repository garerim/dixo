// =============================================================================
// API — POST /api/friends/remove — Supprimer un ami
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withFriendshipAuth } from "../helpers";

const RemoveFriendSchema = z.object({
  friendshipId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withFriendshipAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = RemoveFriendSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Données invalides. friendshipId requis.");
  }

  const result = await service.removeFriend(user.id, parsed.data.friendshipId);

  if (!result.success) {
    return errorResponse(result.error ?? "Impossible de supprimer l'ami.", 400);
  }

  return successResponse(undefined);
}
