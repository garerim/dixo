// =============================================================================
// API — GET /api/admin/stats
// =============================================================================

import { withAdminAuth } from "../helpers";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import type { AdminStats } from "@/types/api";

export async function GET() {
  const { adminClient } = await withAdminAuth();
  if (!adminClient) return errorResponse("Forbidden.", 403);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    usersRes,
    onlineRes,
    premiumRes,
    gamesRes,
    gamesTodayRes,
    activeGamesRes,
    pendingReportsRes,
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).eq("is_online", true),
    adminClient.from("profiles").select("*", { count: "exact", head: true }).neq("subscription", "free"),
    adminClient.from("games").select("*", { count: "exact", head: true }),
    adminClient.from("games").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
    adminClient.from("games").select("*", { count: "exact", head: true }).not("phase", "in", '("GAME_OVER","LOBBY")'),
    adminClient.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const stats: AdminStats = {
    totalUsers: usersRes.count ?? 0,
    onlineUsers: onlineRes.count ?? 0,
    premiumUsers: premiumRes.count ?? 0,
    totalGames: gamesRes.count ?? 0,
    gamesToday: gamesTodayRes.count ?? 0,
    activeGames: activeGamesRes.count ?? 0,
    pendingReports: pendingReportsRes.count ?? 0,
  };

  return successResponse(stats);
}
