// =============================================================================
// API — GET /api/profile/me — Récupérer son propre profil
// API — PATCH /api/profile/me — Mettre à jour son profil
// API — DELETE /api/profile/me — Supprimer son compte (RGPD)
// =============================================================================

import type { UpdateProfileRequest } from "@/types/api";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { withProfileAuth } from "../helpers";

// ─── GET : Récupérer mon profil complet ───
export async function GET() {
  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const result = await service.getMyProfile(user.id);

  if (!result.success) {
    return errorResponse(result.error ?? "Profile not found.", 404);
  }

  return successResponse(result.data);
}

// ─── PATCH : Mettre à jour mon profil ───
export async function PATCH(request: Request) {
  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  let body: UpdateProfileRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  // At least one field required
  if (!body.pseudo && !body.avatarUrl && body.diceSkin === undefined) {
    return errorResponse("At least one field (pseudo, avatarUrl, diceSkin) is required.", 400);
  }

  const result = await service.updateProfile(user.id, {
    pseudo: body.pseudo,
    avatarUrl: body.avatarUrl,
    diceSkin: body.diceSkin,
  });

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to update profile.", 400);
  }

  return successResponse(result.data);
}

// ─── DELETE : Supprimer son compte et toutes ses données (RGPD) ───
export async function DELETE() {
  const { user } = await withProfileAuth();

  if (!user) {
    return errorResponse("Not authenticated.", 401);
  }

  const adminClient = getSupabaseAdminClient();
  const userId = user.id;

  // Delete all user data in order (respecting foreign keys)
  // 1. Notifications
  await adminClient.from("notifications").delete().eq("user_id", userId);

  // 2. Achievements
  await adminClient.from("user_achievements").delete().eq("user_id", userId);

  // 3. Reports (as reporter or reported)
  await adminClient.from("reports").delete().eq("reporter_id", userId);
  await adminClient.from("reports").delete().eq("reported_user_id", userId);

  // 4. Game messages
  await adminClient.from("game_messages").delete().eq("user_id", userId);

  // 5. Private messages (sent and received)
  await adminClient.from("private_messages").delete().eq("sender_id", userId);
  await adminClient.from("private_messages").delete().eq("receiver_id", userId);

  // 6. Friendships
  await adminClient.from("friendships").delete().eq("user_id", userId);
  await adminClient.from("friendships").delete().eq("friend_id", userId);

  // 7. ELO history
  await adminClient.from("elo_history").delete().eq("user_id", userId);

  // 8. User skins
  await adminClient.from("user_skins").delete().eq("user_id", userId);

  // 9. Matchmaking queue
  await adminClient.from("matchmaking_queue").delete().eq("user_id", userId);

  // 10. Game players
  await adminClient.from("game_players").delete().eq("user_id", userId);

  // 11. Avatar from storage
  const { data: files } = await adminClient.storage
    .from("avatars")
    .list(userId);
  if (files && files.length > 0) {
    await adminClient.storage
      .from("avatars")
      .remove(files.map((f) => `${userId}/${f.name}`));
  }

  // 12. Profile
  await adminClient.from("profiles").delete().eq("id", userId);

  // 13. Delete auth user (must be last)
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return errorResponse("Failed to delete account. Please contact support.", 500);
  }

  return successResponse({ deleted: true });
}
