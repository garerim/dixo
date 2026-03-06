// =============================================================================
// API — POST /api/matchmaking/join — Rejoindre la file d'attente
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withMatchmakingAuth } from "../helpers";

const JoinQueueSchema = z.object({
  displayName: z.string().min(1).max(30),
  gameMode: z.enum(["NORMAL", "RANKED"]),
  playerCount: z.union([z.literal(2), z.literal(4)]),
});

export async function POST(request: NextRequest) {
  const { user, service } = await withMatchmakingAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = JoinQueueSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data. displayName, gameMode and playerCount required.");
  }

  const result = await service.joinQueue(
    user.id,
    parsed.data.displayName,
    parsed.data.gameMode,
    parsed.data.playerCount,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Error joining queue.");
  }

  return successResponse(result.data, 201);
}
