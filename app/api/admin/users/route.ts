// =============================================================================
// API — GET/PATCH /api/admin/users
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "../helpers";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import type { AdminUser } from "@/types/api";
import type { ProfileRow } from "@/types/database";

function rowToAdminUser(row: ProfileRow): AdminUser {
  return {
    id: row.id,
    pseudo: row.pseudo,
    avatarUrl: row.avatar_url,
    elo1v1: row.elo_1v1,
    elo4p: row.elo_4p,
    subscription: row.subscription,
    gamesPlayed: row.games_played,
    gamesWon: row.games_won,
    isAdmin: row.is_admin,
    isOnline: row.is_online,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

export async function GET(request: NextRequest) {
  const { adminClient } = await withAdminAuth();
  if (!adminClient) return errorResponse("Forbidden.", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
  const search = searchParams.get("search")?.trim() ?? "";

  let query = adminClient
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike("pseudo", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) return errorResponse("Failed to fetch users.");

  return successResponse({
    rows: (data ?? []).map(rowToAdminUser),
    count: count ?? 0,
  });
}

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  isAdmin: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const { user, adminClient } = await withAdminAuth();
  if (!adminClient || !user) return errorResponse("Forbidden.", 403);

  const body = await request.json().catch(() => null);
  const parsed = UpdateUserSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.");

  const { id, isAdmin } = parsed.data;

  // Prevent removing own admin rights
  if (id === user.id && isAdmin === false) {
    return errorResponse("Cannot remove your own admin rights.");
  }

  const updateData: { is_admin?: boolean } = {};
  if (isAdmin !== undefined) updateData.is_admin = isAdmin;

  const { data: updated, error } = await adminClient
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !updated) return errorResponse("User not found.", 404);

  return successResponse(rowToAdminUser(updated));
}
