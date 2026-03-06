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
    return errorResponse("Not authenticated.", 401);
  }

  // 2. Validation
  const body = await request.json().catch(() => null);
  const parsed = PlaceBidSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid bid: gameId (UUID), quantity (>= 1), faceValue (1-6) required.");
  }

  // 3. Service call
  const result = await service.placeBid(
    user.id,
    parsed.data.gameId,
    parsed.data.quantity,
    parsed.data.faceValue,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Error placing bid.");
  }

  return successResponse(result.data);
}
