// =============================================================================
// API — POST /api/game/settings
// =============================================================================
// Met à jour les paramètres d'une partie privée (hôte uniquement, phase LOBBY).
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, errorResponse, successResponse } from "../helpers";

const UpdateSettingsSchema = z.object({
  gameId: z.string().uuid(),
  initialDiceCount: z.union([z.literal(3), z.literal(5), z.literal(7)]).optional(),
  pacosAreWild: z.boolean().optional(),
  turnTimer: z.union([z.null(), z.literal(15), z.literal(30), z.literal(60)]).optional(),
  maxPlayers: z.number().int().min(2).max(6).optional(),
});

export async function POST(request: NextRequest) {
  // 1. Authentification
  const { user, service } = await withAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  // 2. Validation
  const body = await request.json().catch(() => null);
  const parsed = UpdateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid settings.");
  }

  // 3. Appel du service
  const { gameId, ...settings } = parsed.data;
  const result = await service.updateSettings(user.id, gameId, settings);

  if (!result.success) {
    return errorResponse(result.error ?? "Error updating settings.");
  }

  return successResponse(result.data);
}
