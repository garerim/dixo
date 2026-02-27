// =============================================================================
// API — GET /api/profile/elo-history — Historique ELO du joueur connecté
// =============================================================================

import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EloHistoryRepository } from "@/lib/database/elo-history-repository";
import type { EloHistoryEntry } from "@/types/api";

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return errorResponse("Non authentifié.", 401);
  }

  try {
    // Optionnel : filtrer par mode (1v1 ou 4p)
    const { searchParams } = new URL(request.url);
    const rankedMode = searchParams.get("mode") ?? undefined;

    const repository = new EloHistoryRepository(supabase);
    const rows = await repository.findByUserId(user.id, 100, rankedMode);

    const entries: EloHistoryEntry[] = rows.map((row) => ({
      elo: row.elo,
      delta: row.delta,
      gameId: row.game_id,
      rankedMode: row.ranked_mode,
      createdAt: row.created_at,
    }));

    return successResponse(entries);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Erreur inconnue.",
      500,
    );
  }
}
