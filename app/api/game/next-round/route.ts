// =============================================================================
// API — POST /api/game/next-round
// =============================================================================
// Passe au round suivant après l'affichage des résultats.
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, errorResponse, successResponse } from "../helpers";

const NextRoundSchema = z.object({
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
  const parsed = NextRoundSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid game ID.");
  }

  // 3. Appel du service
  const result = await service.nextRound(user.id, parsed.data.gameId);

  if (!result.success) {
    return errorResponse(result.error ?? "Error moving to next round.");
  }

  return successResponse(result.data);
}
