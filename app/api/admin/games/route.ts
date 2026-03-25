// =============================================================================
// API — GET /api/admin/games
// =============================================================================

import { NextRequest } from "next/server";
import { withAdminAuth } from "../helpers";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import type { AdminGame } from "@/types/api";

export async function GET(request: NextRequest) {
  const { adminClient } = await withAdminAuth();
  if (!adminClient) return errorResponse("Forbidden.", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const { data, error, count } = await adminClient
    .from("games")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse("Failed to fetch games.");

  // Fetch host and winner pseudos
  const hostIds = [...new Set((data ?? []).map((g) => g.host_id).filter(Boolean))];
  const winnerIds = [...new Set((data ?? []).map((g) => g.winner_id).filter(Boolean))] as string[];
  const allIds = [...new Set([...hostIds, ...winnerIds])];

  let pseudoMap: Record<string, string> = {};
  if (allIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, pseudo")
      .in("id", allIds);

    if (profiles) {
      pseudoMap = Object.fromEntries(profiles.map((p) => [p.id, p.pseudo]));
    }
  }

  const rows: AdminGame[] = (data ?? []).map((g) => {
    // Count players from the state JSON
    const state = g.state as Record<string, unknown> | null;
    const players = (state && Array.isArray((state as Record<string, unknown>).players))
      ? (state as Record<string, unknown>).players as unknown[]
      : [];

    return {
      id: g.id,
      joinCode: g.join_code,
      gameMode: g.game_mode,
      phase: g.phase,
      round: g.round,
      playerCount: players.length,
      hostPseudo: pseudoMap[g.host_id] ?? null,
      winnerPseudo: g.winner_id ? (pseudoMap[g.winner_id] ?? null) : null,
      createdAt: g.created_at,
    };
  });

  return successResponse({ rows, count: count ?? 0 });
}
