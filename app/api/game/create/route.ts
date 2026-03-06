// =============================================================================
// API — POST /api/game/create
// =============================================================================
// Crée une nouvelle partie. L'utilisateur authentifié devient l'hôte.
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { GameMode } from "@/core/game-engine";
import { withAuth, errorResponse, successResponse } from "../helpers";

const CreateGameSchema = z.object({
  displayName: z.string().min(1).max(30),
  gameMode: z.enum(["PRIVATE", "NORMAL", "RANKED"]).optional().default("PRIVATE"),
});

export async function POST(request: NextRequest) {
  // 1. Authentification
  const { user, service } = await withAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  // 2. Validate inputs
  const body = await request.json().catch(() => null);
  const parsed = CreateGameSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Display name required (1-30 characters).");
  }

  // 3. Convert game mode
  const gameModeMap: Record<string, GameMode> = {
    PRIVATE: GameMode.PRIVATE,
    NORMAL: GameMode.NORMAL,
    RANKED: GameMode.RANKED,
  };
  const gameMode = gameModeMap[parsed.data.gameMode] ?? GameMode.PRIVATE;

  // 4. Service call
  const result = await service.createGame(user.id, parsed.data.displayName, gameMode);

  if (!result.success) {
    return errorResponse(result.error ?? "Error creating game.");
  }

  return successResponse(result.data, 201);
}
