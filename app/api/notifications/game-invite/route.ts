// =============================================================================
// API — POST /api/notifications/game-invite — Créer une notification d'invitation
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/services/notification-service";
import { ProfileRepository } from "@/lib/database/profile-repository";

const Schema = z.object({
  recipientId: z.string().uuid(),
  gameId: z.string().uuid(),
  joinCode: z.string().length(6),
});

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data.");
  }

  const admin = getSupabaseAdminClient();
  const profiles = new ProfileRepository(admin);
  const senderProfile = await profiles.findById(user.id);

  if (senderProfile) {
    await NotificationService.notifyGameInvite(
      admin,
      parsed.data.recipientId,
      senderProfile.pseudo,
      parsed.data.gameId,
      parsed.data.joinCode,
    );
  }

  return successResponse(undefined, 201);
}
