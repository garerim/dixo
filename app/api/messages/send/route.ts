// =============================================================================
// API — POST /api/messages/send — Envoyer un message
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withMessageAuth } from "../helpers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { NotificationService } from "@/services/notification-service";

const SendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withMessageAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data. receiverId and content required.");
  }

  const result = await service.sendMessage(
    user.id,
    parsed.data.receiverId,
    parsed.data.content,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to send message.", 400);
  }

  // Notify the receiver (with deduplication to avoid spam)
  if (result.data) {
    const admin = getSupabaseAdminClient();
    await NotificationService.notifyMessageReceived(
      admin,
      parsed.data.receiverId,
      result.data.senderPseudo,
      result.data.senderAvatarUrl,
      user.id,
    );
  }

  return successResponse(result.data, 201);
}
