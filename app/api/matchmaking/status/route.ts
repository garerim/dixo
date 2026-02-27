// =============================================================================
// API — GET /api/matchmaking/status — Statut de la file d'attente
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withMatchmakingAuth } from "../helpers";

export async function GET() {
  const { user, service } = await withMatchmakingAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  const result = await service.getQueueStatus(user.id);

  if (!result.success) {
    return errorResponse(result.error ?? "Pas en file d'attente.", 404);
  }

  return successResponse(result.data);
}
