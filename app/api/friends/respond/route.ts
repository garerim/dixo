// =============================================================================
// API — POST /api/friends/respond — Répondre à une demande d'amitié
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withFriendshipAuth } from "../helpers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/services/notification-service";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { FriendshipRepository } from "@/lib/database/friendship-repository";

const RespondSchema = z.object({
  friendshipId: z.string().uuid(),
  accept: z.boolean(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withFriendshipAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = RespondSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data. friendshipId and accept required.");
  }

  const result = await service.respondToRequest(
    user.id,
    parsed.data.friendshipId,
    parsed.data.accept,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to respond to request.", 400);
  }

  // If accepted, notify the original requester
  if (parsed.data.accept) {
    const admin = getSupabaseAdminClient();
    const profiles = new ProfileRepository(admin);
    const friendships = new FriendshipRepository(admin);
    const accepterProfile = await profiles.findById(user.id);

    // Find who sent the original request (user_id in the friendship row)
    const allFriendships = await friendships.findByUserId(user.id);
    const friendship = allFriendships.find((f) => f.id === parsed.data.friendshipId);
    if (accepterProfile && friendship) {
      await NotificationService.notifyFriendRequestAccepted(
        admin,
        friendship.user_id, // The original requester
        accepterProfile.pseudo,
        accepterProfile.avatar_url,
      );
    }
  }

  return successResponse(undefined);
}
