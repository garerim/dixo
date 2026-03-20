// =============================================================================
// API — POST /api/friends/add — Ajouter un ami
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withFriendshipAuth } from "../helpers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/services/notification-service";
import { ProfileRepository } from "@/lib/database/profile-repository";

const AddFriendSchema = z.object({
  friendId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withFriendshipAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = AddFriendSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data. friendId required.");
  }

  const result = await service.addFriend(user.id, parsed.data.friendId);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to add friend.", 400);
  }

  // Notify the recipient of the friend request
  const admin = getSupabaseAdminClient();
  const profiles = new ProfileRepository(admin);
  const senderProfile = await profiles.findById(user.id);
  if (senderProfile && result.data) {
    await NotificationService.notifyFriendRequestReceived(
      admin,
      parsed.data.friendId,
      senderProfile.pseudo,
      senderProfile.avatar_url,
      result.data.friendshipId,
    );
  }

  return successResponse(result.data, 201);
}
