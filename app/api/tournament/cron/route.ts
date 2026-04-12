import { NextRequest, NextResponse } from "next/server";
import { TournamentService } from "@/services/tournament-service";

async function handleCron(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = new TournamentService();

  // Create today's tournaments if they don't exist
  const createResult = await service.createAutomaticTournaments([
    "14:00",
    "21:00",
  ]);

  // Start any tournaments whose registration deadline has passed
  const startResult = await service.startExpiredRegistrations();

  return NextResponse.json({
    success: true,
    data: {
      created: createResult.success ? createResult.data : [],
      started: startResult.success ? startResult.data : 0,
    },
  });
}

// Vercel Cron uses GET requests
export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
