// =============================================================================
// ADMIN — Panneau de gestion des signalements (client component)
// =============================================================================

"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminReport } from "@/types/api";
import type { ReportRow } from "@/types/database";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<ReportRow["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  reviewed: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  resolved: "bg-green-500/20 text-green-500 border-green-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const REASON_LABELS: Record<ReportRow["reason"], string> = {
  inappropriate_content: "Inappropriate content",
  harassment: "Harassment",
  cheating: "Cheating",
  spam: "Spam",
  other: "Other",
};

export function AdminReportsPanel() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const offset = page * PAGE_SIZE;
      const res = await fetch(`/api/admin/reports?limit=${PAGE_SIZE}&offset=${offset}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data.rows);
        setCount(json.data.count);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const updateReport = async (id: string, status: ReportRow["status"], adminNotes?: string) => {
    const res = await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNotes }),
    });
    const json = await res.json();
    if (json.success) {
      setReports((prev) => prev.map((r) => (r.id === id ? json.data : r)));
      setEditingId(null);
      setNotes("");
      toast.success("Report updated.");
    } else {
      toast.error("Failed to update report.");
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-6 py-4">
        <Flag className="size-5 text-destructive" />
        <h1 className="text-xl font-bold">Admin — Reports</h1>
        <Badge variant="secondary" className="ml-auto">
          {count} total
        </Badge>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No reports found.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter ID</TableHead>
                  <TableHead>Target ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <Fragment key={report.id}>
                    <TableRow>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.reportType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {REASON_LABELS[report.reason]}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {report.reporterId.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {(report.reportedUserId ?? report.reportedMessageId ?? "—").slice(0, 8)}…
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                          {report.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {report.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReport(report.id, "reviewed")}
                            >
                              Review
                            </Button>
                          )}
                          {(report.status === "pending" || report.status === "reviewed") && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateReport(report.id, "resolved")}
                              >
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateReport(report.id, "dismissed")}
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(editingId === report.id ? null : report.id);
                              setNotes(report.adminNotes ?? "");
                            }}
                          >
                            Notes
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {editingId === report.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          {report.description && (
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Reporter note: </span>
                              {report.description}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Admin notes..."
                              maxLength={1000}
                              rows={2}
                              className="resize-none text-sm"
                            />
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                onClick={() => updateReport(report.id, report.status, notes)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingId(null); setNotes(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
