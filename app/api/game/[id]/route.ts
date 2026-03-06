// =============================================================================
// API — GET /api/game/[id]
// =============================================================================
// Récupère l'état d'une partie pour le joueur authentifié.
// =============================================================================

import { NextRequest } from "next/server";
import { withAuth, errorResponse, successResponse } from "../helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authentification
  const { user, service } = await withAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  // 2. Get gameId from params
  const { id: gameId } = await params;
  if (!gameId) {
    return errorResponse("Game ID required.");
  }

  // 3. Service call
  const result = await service.getGameState(user.id, gameId);

  if (!result.success) {
    return errorResponse(result.error ?? "Game not found.", 404);
  }

  return successResponse(result.data);
}
