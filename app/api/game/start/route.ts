// =============================================================================
// API — POST /api/game/start
// =============================================================================
// Démarre une partie (hôte uniquement).
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, errorResponse, successResponse } from "../helpers";

const StartGameSchema = z.object({
  gameId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  // 1. Authentification
  const { user, service } = await withAuth();
  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  // 2. Validation
  const body = await request.json().catch(() => null);
  const parsed = StartGameSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("ID de partie invalide.");
  }

  // 3. Appel du service
  const result = await service.startGame(user.id, parsed.data.gameId);

  if (!result.success) {
    return errorResponse(result.error ?? "Erreur lors du démarrage.");
  }

  return successResponse(result.data);
}
