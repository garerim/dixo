// =============================================================================
// FEATURE — Report Dialog
// =============================================================================

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportClient } from "../api/report-client";
import type { ReportRow } from "@/types/database";

const REASONS: { value: ReportRow["reason"]; label: string }[] = [
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment" },
  { value: "cheating", label: "Cheating" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: "player" | "message";
  targetId: string;
  targetLabel: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  reportType,
  targetId,
  targetLabel,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportRow["reason"] | "">("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const res = await reportClient.createReport({
        reportType,
        ...(reportType === "player"
          ? { reportedUserId: targetId }
          : { reportedMessageId: targetId }),
        reason,
        description: description.trim() || undefined,
      });

      if (res.success) {
        toast.success("Report submitted. Thank you for helping keep the community safe.");
        onOpenChange(false);
        setReason("");
        setDescription("");
      } else if (res.error?.includes("Too many")) {
        toast.error("Too many reports. Please wait before submitting another.");
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Report {reportType === "player" ? targetLabel : "message"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReportRow["reason"])}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">
              Additional details{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide more context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
