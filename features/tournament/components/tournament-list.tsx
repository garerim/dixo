"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Trophy, Users, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TournamentRow } from "@/types/database";

interface TournamentListProps {
  tournaments: TournamentRow[];
  isLoading: boolean;
}

export function TournamentList({ tournaments, isLoading }: TournamentListProps) {
  const t = useTranslations("tournament");
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Trophy className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("noTournaments")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tournaments.map((tournament) => {
        const deadline = new Date(tournament.registration_deadline);
        const isRegistration = tournament.status === "registration";
        const isInProgress = tournament.status === "in_progress";

        return (
          <Card
            key={tournament.id}
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => router.push(`/tournaments/${tournament.id}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-yellow-500" />
                  {tournament.name}
                </CardTitle>
                <Badge variant={isRegistration ? "default" : isInProgress ? "secondary" : "outline"}>
                  {isRegistration ? t("registrationOpen") : isInProgress ? t("inProgress") : t("completed")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  <span>{tournament.max_participants} max</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span>{deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {tournament.reward_skin_id && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    🎲 {t("skinReward")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
