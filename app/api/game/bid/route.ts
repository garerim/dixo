// =============================================================================
// API — POST /api/game/bid
// =============================================================================
// Place une enchère dans une partie en cours.
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, errorResponse, successResponse } from "../helpers";

const PlaceBidSchema = z.object({
  gameId: z.string().uuid(),
  quantity: z.number().int().min(1),
  faceValue: z.number().int().min(1).max(6),
});

export async function POST(request: NextRequest) {
  // 1. Authentification
  const { user, service } = await withAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  // 2. Validation
  const body = await request.json().catch(() => null);
  const parsed = PlaceBidSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Enchère invalide : gameId (UUID), quantity (>= 1), faceValue (1-6) requis.");
  }

  // 3. Appel du service
  const result = await service.placeBid(
    user.id,
    parsed.data.gameId,
    parsed.data.quantity,
    parsed.data.faceValue,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Erreur lors de l'enchère.");
  }

  return successResponse(result.data);
}
