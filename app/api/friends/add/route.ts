// =============================================================================
// API — POST /api/friends/add — Ajouter un ami
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withFriendshipAuth } from "../helpers";

const AddFriendSchema = z.object({
  friendId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withFriendshipAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = AddFriendSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Données invalides. friendId requis.");
  }

  const result = await service.addFriend(user.id, parsed.data.friendId);

  if (!result.success) {
    return errorResponse(result.error ?? "Impossible d'ajouter l'ami.", 400);
  }

  return successResponse(result.data, 201);
}
