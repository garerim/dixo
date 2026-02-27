// =============================================================================
// API — GET /api/messages/conversation — Récupérer une conversation
// =============================================================================

import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withMessageAuth } from "../helpers";

export async function GET(request: NextRequest) {
  const { user, service } = await withMessageAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const { searchParams } = new URL(request.url);
  const friendId = searchParams.get("friendId");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const before = searchParams.get("before") ?? undefined;

  if (!friendId) {
    return errorResponse("friendId requis.");
  }

  const result = await service.getConversation(user.id, friendId, limit, before);

  if (!result.success) {
    return errorResponse(result.error ?? "Impossible de récupérer la conversation.", 400);
  }

  return successResponse(result.data);
}
