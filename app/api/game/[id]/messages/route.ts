// =============================================================================
// API — GET/POST /api/game/[id]/messages — Messages de chat dans une partie
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GameMessageService } from "@/services/game-message-service";

const SendMessageSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: gameId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return errorResponse("Not authenticated.", 401);
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const before = searchParams.get("before") ?? undefined;

  const service = new GameMessageService(supabase);
  const result = await service.getMessages(gameId, user.id, limit, before);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to retrieve messages.", 400);
  }

  return successResponse(result.data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: gameId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data. content required (1-500 characters).");
  }

  const service = new GameMessageService(supabase);
  const result = await service.sendMessage(gameId, user.id, parsed.data.content);

  if (!result.success) {
    return errorResponse(result.error ?? "Unable to send message.", 400);
  }

  return successResponse(result.data, 201);
}
