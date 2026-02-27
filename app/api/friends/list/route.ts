// =============================================================================
// API — GET /api/friends/list — Liste des amis
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withFriendshipAuth } from "../helpers";

export async function GET() {
  const { user, service } = await withFriendshipAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const result = await service.getFriends(user.id);

  if (!result.success) {
    return errorResponse(result.error ?? "Impossible de récupérer la liste des amis.", 400);
  }

  return successResponse(result.data);
}
