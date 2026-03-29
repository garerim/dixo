import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TournamentService } from "@/services/tournament-service";

const schema = z.object({ tournamentId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );

  const service = new TournamentService();
  const result = await service.register(parsed.data.tournamentId, user.id);

  if (!result.success)
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 },
    );
  return NextResponse.json({ success: true });
}
