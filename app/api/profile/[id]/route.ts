// =============================================================================
// API — GET /api/profile/:id — Récupérer le profil public d'un utilisateur
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { withProfileAuth } from "../helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;

  const { user, service } = await withProfileAuth();

  if (!user || !service) {
    return errorResponse("Non authentifié.", 401);
  }

  // Si c'est son propre profil → retourner la version complète
  if (targetUserId === user.id) {
    const result = await service.getMyProfile(user.id);
    if (!result.success) {
      return errorResponse(result.error ?? "Profil non trouvé.", 404);
    }
    return successResponse(result.data);
  }

  // Sinon → profil public
  const result = await service.getPublicProfile(targetUserId);

  if (!result.success) {
    return errorResponse(result.error ?? "Profil non trouvé.", 404);
  }

  return successResponse(result.data);
}
