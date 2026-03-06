// =============================================================================
// API — POST /api/game/surrender
// =============================================================================
// Le joueur abandonne la partie. L'adversaire gagne.
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, errorResponse, successResponse } from "../helpers";

const SurrenderSchema = z.object({
  gameId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  // 1. Authentification
  const { user, service } = await withAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  // 2. Validation
  const body = await request.json().catch(() => null);
  const parsed = SurrenderSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid game ID.");
  }

  // 3. Appel du service
  const result = await service.surrenderGame(user.id, parsed.data.gameId);

  if (!result.success) {
    return errorResponse(result.error ?? "Error during surrender.");
  }

  return successResponse(result.data);
}
