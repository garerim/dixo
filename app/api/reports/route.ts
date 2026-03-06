// =============================================================================
// API — POST /api/reports
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ReportRepository } from "@/lib/database/report-repository";
import { errorResponse, successResponse } from "@/app/api/game/helpers";

const CreateReportSchema = z.discriminatedUnion("reportType", [
  z.object({
    reportType: z.literal("player"),
    reportedUserId: z.string().uuid(),
    reportedMessageId: z.undefined().optional(),
    reason: z.enum(["inappropriate_content", "harassment", "cheating", "spam", "other"]),
    description: z.string().max(500).optional(),
  }),
  z.object({
    reportType: z.literal("message"),
    reportedUserId: z.undefined().optional(),
    reportedMessageId: z.string().uuid(),
    reason: z.enum(["inappropriate_content", "harassment", "cheating", "spam", "other"]),
    description: z.string().max(500).optional(),
  }),
]);

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Not authenticated.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateReportSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid report data.");
  }

  const repo = new ReportRepository(supabase);

  // Anti-spam: max 10 reports per hour
  const recentCount = await repo.countRecentByReporter(user.id, 60);
  if (recentCount >= 10) {
    return errorResponse("Too many reports. Please wait before submitting another.", 429);
  }

  const { reportType, reason, description } = parsed.data;
  const reportedUserId = parsed.data.reportType === "player" ? parsed.data.reportedUserId : null;
  const reportedMessageId = parsed.data.reportType === "message" ? parsed.data.reportedMessageId : null;

  const report = await repo.create({
    reporter_id: user.id,
    report_type: reportType,
    reported_user_id: reportedUserId ?? null,
    reported_message_id: reportedMessageId ?? null,
    reason,
    description: description ?? null,
  });

  return successResponse({ id: report.id }, 201);
}
