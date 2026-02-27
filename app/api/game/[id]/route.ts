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
    return errorResponse("Non authentifié.", 401);
  }

  // 2. Récupérer le gameId depuis les params
  const { id: gameId } = await params;
  if (!gameId) {
    return errorResponse("ID de partie requis.");
  }

  // 3. Appel du service
  const result = await service.getGameState(user.id, gameId);

  if (!result.success) {
    return errorResponse(result.error ?? "Partie non trouvée.", 404);
  }

  return successResponse(result.data);
}
