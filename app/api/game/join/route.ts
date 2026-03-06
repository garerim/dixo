// =============================================================================
// API — POST /api/game/join
// =============================================================================
// Rejoint une partie existante via un code d'accès.
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth, errorResponse, successResponse } from "../helpers";

const JoinGameSchema = z.object({
  joinCode: z.string().length(6),
  displayName: z.string().min(1).max(30),
});

export async function POST(request: NextRequest) {
  // 1. Authentification
  const { user, service } = await withAuth();
  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  // 2. Validate inputs
  const body = await request.json().catch(() => null);
  const parsed = JoinGameSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Access code (6 characters) and display name required.");
  }

  // 3. Service call
  const result = await service.joinGame(
    user.id,
    parsed.data.displayName,
    parsed.data.joinCode,
  );

  if (!result.success) {
    return errorResponse(result.error ?? "Error joining game.");
  }

  return successResponse(result.data);
}
