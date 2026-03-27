// =============================================================================
// FEATURE — Modal de profil ami
// =============================================================================

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Flag } from "lucide-react";
import type { FriendInfo } from "@/types/api";
import { ReportDialog } from "@/features/reports/components/report-dialog";

interface FriendProfileModalProps {
  friend: FriendInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendProfileModal({
  friend,
  open,
  onOpenChange,
}: FriendProfileModalProps) {
  const t = useTranslations("friendProfile");
  const tc = useTranslations("common");
  const [reportOpen, setReportOpen] = useState(false);

  if (!friend) return null;

  // Note: On n'a pas accès aux stats complètes depuis FriendInfo
  // On affiche seulement ce qui est disponible dans FriendInfo
  // Pour les stats complètes, il faudrait un endpoint /api/profile/:userId/public

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title", { name: friend.pseudo })}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* ── Identity card ── */}
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start">
              {/* Avatar */}
              <Avatar className="size-20">
                <AvatarImage src={friend.avatarUrl ?? undefined} alt={friend.pseudo} />
                <AvatarFallback className="text-xl">
                  {friend.pseudo.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
                <h2 className="text-2xl font-bold">{friend.pseudo}</h2>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={friend.isOnline ? "default" : "secondary"}>
                    {friend.isOnline ? tc("online") : tc("offline")}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Trophy className="size-3" />
                    1v1: {friend.elo1v1}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Users className="size-3" />
                    4p: {friend.elo4p}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── ELO Ranking ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-yellow-500" />
                {t("ranking")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div>
                  <p className="text-3xl font-bold">{friend.elo1v1}</p>
                  <p className="text-sm text-muted-foreground">{t("elo1v1")}</p>
                </div>
                <Separator orientation="vertical" className="h-auto" />
                <div>
                  <p className="text-3xl font-bold">{friend.elo4p}</p>
                  <p className="text-sm text-muted-foreground">{t("elo4p")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report button */}
        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground hover:text-destructive"
            onClick={() => setReportOpen(true)}
          >
            <Flag className="size-3" />
            {t("report")}
          </Button>
        </div>
      </DialogContent>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        reportType="player"
        targetId={friend.id}
        targetLabel={friend.pseudo}
      />
    </Dialog>
  );
}
