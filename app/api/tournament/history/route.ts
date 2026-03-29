import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TournamentService } from "@/services/tournament-service";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );

  const service = new TournamentService();
  const result = await service.getTournamentHistory(user.id);

  if (!result.success)
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 },
    );
  return NextResponse.json({ success: true, data: result.data });
}
