// =============================================================================
// API — POST /api/matchmaking/leave — Quitter la file d'attente
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withMatchmakingAuth } from "../helpers";

const LeaveQueueSchema = z.object({
  queueEntryId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withMatchmakingAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = LeaveQueueSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("queueEntryId required.");
  }

  const result = await service.leaveQueue(user.id, parsed.data.queueEntryId);

  if (!result.success) {
    return errorResponse(result.error ?? "Error leaving queue.");
  }

  return successResponse(undefined);
}
