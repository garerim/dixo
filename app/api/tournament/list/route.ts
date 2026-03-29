import { NextResponse } from "next/server";
import { TournamentService } from "@/services/tournament-service";

export async function GET() {
  const service = new TournamentService();

  // Check and start any expired registrations
  await service.startExpiredRegistrations();

  const result = await service.listOpen();
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true, data: result.data });
}
