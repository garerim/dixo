// =============================================================================
// INFRASTRUCTURE — Report Repository
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReportRow } from "@/types/database";

export class ReportRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async create(
    data: Omit<ReportRow, "id" | "status" | "admin_notes" | "created_at" | "updated_at">,
  ): Promise<ReportRow> {
    const { data: row, error } = await this.supabase
      .from("reports")
      .insert(data)
      .select()
      .single();

    if (error || !row) {
      throw new Error(`Error creating report: ${error?.message}`);
    }

    return row;
  }

  async findAll(
    limit: number,
    offset: number,
  ): Promise<{ rows: ReportRow[]; count: number }> {
    const { data, error, count } = await this.supabase
      .from("reports")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error fetching reports: ${error.message}`);
    }

    return { rows: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<ReportRow | null> {
    const { data, error } = await this.supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async update(
    id: string,
    data: { status?: ReportRow["status"]; admin_notes?: string },
  ): Promise<ReportRow | null> {
    const { data: row, error } = await this.supabase
      .from("reports")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !row) return null;
    return row;
  }

  /** Anti-spam: compte les signalements du reporter dans les dernières N minutes */
  async countRecentByReporter(reporterId: string, sinceMinutes: number): Promise<number> {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();
    const { count, error } = await this.supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("reporter_id", reporterId)
      .gte("created_at", since);

    if (error) return 0;
    return count ?? 0;
  }
}
