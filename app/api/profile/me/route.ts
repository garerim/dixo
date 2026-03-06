// =============================================================================
// API — GET /api/profile/me — Récupérer son propre profil
// API — PATCH /api/profile/me — Mettre à jour son profil
// =============================================================================

import { NextResponse } from "next/server";
import type { UpdateProfileRequest } from "@/types/api";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withProfileAuth } from "../helpers";

// ─── GET : Récupérer mon profil complet ───
export async function GET() {
  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  const result = await service.getMyProfile(user.id);

  if (!result.success) {
    return errorResponse(result.error ?? "Profile not found.", 404);
  }

  return successResponse(result.data);
}

// ─── PATCH : Mettre à jour mon profil ───
export async function PATCH(request: Request) {
  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Not authenticated.", 401);
  }

  let body: UpdateProfileRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  // At least one field required
  if (!body.pseudo && !body.avatarUrl) {
    return errorResponse("At least one field (pseudo, avatarUrl) is required.", 400);
  }

  const result = await service.updateProfile(user.id, {
    pseudo: body.pseudo,
    avatarUrl: body.avatarUrl,
  });

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to update profile.", 400);
  }

  return successResponse(result.data);
}
