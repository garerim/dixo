import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/services/tournament-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const service = new TournamentService();
  const result = await service.getTournament(id);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 404 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
