// =============================================================================
// API — GET /api/friends/list — Liste des amis
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withFriendshipAuth } from "../helpers";

export async function GET() {
  const { user, service } = await withFriendshipAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const result = await service.getFriends(user.id);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to retrieve friends list.", 400);
  }

  return successResponse(result.data);
}
