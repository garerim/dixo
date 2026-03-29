"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/auth-provider";
import { Trophy, Users, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { TournamentRow } from "@/types/database";

interface TournamentLobbyProps {
  tournament: TournamentRow;
  participantCount: number;
  isRegistered: boolean;
  onRegister: () => Promise<{ success: boolean; error?: string }>;
  onUnregister: () => Promise<{ success: boolean; error?: string }>;
}

export function TournamentLobby({
  tournament,
  participantCount,
  isRegistered,
  onRegister,
  onUnregister,
}: TournamentLobbyProps) {
  const t = useTranslations("tournament");
  const { user } = useAuth();
  const [countdown, setCountdown] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer
  useEffect(() => {
    const deadline = new Date(tournament.registration_deadline).getTime();

    function update() {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setCountdown("00:00");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(
        hours > 0
          ? `${hours}h ${String(minutes).padStart(2, "0")}m`
          : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [tournament.registration_deadline]);

  async function handleRegister() {
    setIsSubmitting(true);
    const result = await onRegister();
    if (!result.success) toast.error(result.error ?? t("registerError"));
    setIsSubmitting(false);
  }

  async function handleUnregister() {
    setIsSubmitting(true);
    const result = await onUnregister();
    if (!result.success) toast.error(result.error ?? t("unregisterError"));
    setIsSubmitting(false);
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Tournament info */}
      <div className="flex size-20 items-center justify-center rounded-3xl bg-yellow-500/10">
        <Trophy className="size-11 text-yellow-500" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold">{tournament.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("format.single_elimination")}
        </p>
      </div>

      {/* Countdown */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {t("startsIn")}
        </div>
        <span className="text-4xl font-bold tabular-nums">{countdown}</span>
      </div>

      {/* Participants */}
      <div className="flex items-center gap-2">
        <Users className="size-4 text-muted-foreground" />
        <span className="text-sm">
          {t("participants", { count: participantCount, max: tournament.max_participants })}
        </span>
      </div>

      {/* Reward */}
      {tournament.reward_skin_id && (
        <Badge variant="outline" className="gap-1">
          🎲 {t("skinReward")}
        </Badge>
      )}

      <Badge variant="secondary">
        {t("eloBonus", { bonus: tournament.elo_bonus_winner })}
      </Badge>

      {/* Register/Unregister button */}
      {user && (
        <div className="flex flex-col gap-2">
          {isRegistered ? (
            <Button
              variant="outline"
              size="lg"
              onClick={handleUnregister}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("unregister")}
            </Button>
          ) : (
            <Button
              size="lg"
              className="gap-2"
              onClick={handleRegister}
              disabled={isSubmitting || participantCount >= tournament.max_participants}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Trophy className="size-4" />
              {t("register")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
