// =============================================================================
// FEATURE — Report Dialog
// =============================================================================

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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

const REASON_KEYS: { value: ReportRow["reason"]; labelKey: string }[] = [
  { value: "inappropriate_content", labelKey: "inappropriateContent" },
  { value: "harassment", labelKey: "harassment" },
  { value: "cheating", labelKey: "cheating" },
  { value: "spam", labelKey: "spam" },
  { value: "other", labelKey: "other" },
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
  const t = useTranslations("report");
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
        toast.success(t("success"));
        onOpenChange(false);
        setReason("");
        setDescription("");
      } else if (res.error?.includes("Too many")) {
        toast.error(t("tooMany"));
      } else {
        toast.error(t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reportType === "player"
              ? t("title", { target: targetLabel })
              : t("titleMessage")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">{t("reason")}</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReportRow["reason"])}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder={t("selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {REASON_KEYS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">
              {t("additionalDetails")}{" "}
              <span className="text-muted-foreground">{t("optional")}</span>
            </Label>
            <Textarea
              id="description"
              placeholder={t("placeholder")}
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
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? t("submitting") : t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
