// =============================================================================
// API — POST /api/messages/send — Envoyer un message
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withMessageAuth } from "../helpers";

const SendMessageSchema = z.object({
  receiverId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withMessageAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Données invalides. receiverId et content requis.");
  }

  const result = await service.sendMessage(
    user.id,
    parsed.data.receiverId,
    parsed.data.content,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Impossible d'envoyer le message.", 400);
  }

  return successResponse(result.data, 201);
}
