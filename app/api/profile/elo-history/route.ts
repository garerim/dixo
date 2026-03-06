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
    return errorResponse("Not authenticated.", 401);
  }

  try {
    // Optionnel : filtrer par mode (1v1 ou 4p)
    const { searchParams } = new URL(request.url);
    const rankedMode = searchParams.get("mode") ?? undefined;

    // Limiter l'historique pour les membres Free (10 dernières entrées)
    const { data: profileDataRaw } = await supabase
      .from("profiles")
      .select("subscription")
      .eq("id", user.id)
      .single();
    const profileData = profileDataRaw as { subscription: string } | null;

    const historyLimit = profileData?.subscription === "free" ? 10 : 200;

    const repository = new EloHistoryRepository(supabase);
    const rows = await repository.findByUserId(user.id, historyLimit, rankedMode);

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
      err instanceof Error ? err.message : "Unknown error.",
      500,
    );
  }
}
