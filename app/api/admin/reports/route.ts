// =============================================================================
// API — GET/PATCH /api/admin/reports
// =============================================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { withAdminAuth } from "../helpers";
import { ReportRepository } from "@/lib/database/report-repository";
import { errorResponse, successResponse } from "@/app/api/game/helpers";
import type { AdminReport } from "@/types/api";
import type { ReportRow } from "@/types/database";

function rowToAdminReport(row: ReportRow): AdminReport {
  return {
    id: row.id,
    reportType: row.report_type,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    reportedMessageId: row.reported_message_id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const { adminClient } = await withAdminAuth();
  if (!adminClient) return errorResponse("Forbidden.", 403);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const repo = new ReportRepository(adminClient);
  const { rows, count } = await repo.findAll(limit, offset);

  return successResponse({ rows: rows.map(rowToAdminReport), count });
}

const UpdateReportSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "reviewed", "resolved", "dismissed"]).optional(),
  adminNotes: z.string().max(1000).optional(),
});

export async function PATCH(request: NextRequest) {
  const { adminClient } = await withAdminAuth();
  if (!adminClient) return errorResponse("Forbidden.", 403);

  const body = await request.json().catch(() => null);
  const parsed = UpdateReportSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid data.");

  const { id, status, adminNotes } = parsed.data;
  const repo = new ReportRepository(adminClient);

  const updated = await repo.update(id, {
    ...(status && { status }),
    ...(adminNotes !== undefined && { admin_notes: adminNotes }),
  });

  if (!updated) return errorResponse("Report not found.", 404);

  return successResponse(rowToAdminReport(updated));
}
