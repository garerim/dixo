// =============================================================================
// FEATURE — Report Client API
// =============================================================================

import type { CreateReportRequest, CreateReportResponse } from "@/types/api";

export const reportClient = {
  async createReport(data: CreateReportRequest): Promise<CreateReportResponse> {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
