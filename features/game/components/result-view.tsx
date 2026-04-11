"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, ArrowRight, Flag, Target, Plus, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { PublicGameState } from "@/types/api";
import { PlayerCard } from "./player-card";
import { DiceFace } from "./dice-face";

interface ResultViewProps {
  gameState: PublicGameState;
  playerId: string;
  onNextRound: () => Promise<void>;
  onSurrender: () => Promise<void>;
  isRanked: boolean;
}

export function ResultView({
  gameState,
  playerId,
  onNextRound,
  onSurrender,
  isRanked,
}: ResultViewProps) {
  const t = useTranslations("game.result");
  const tSurrender = useTranslations("game.surrender");
  const challenge = gameState.lastChallengeResult;

  // Animation stages
  const [showOverlay, setShowOverlay] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showBidVsReality, setShowBidVsReality] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    if (!challenge) return;
    const t1 = setTimeout(() => setShowOverlay(true), 50);
    const t2 = setTimeout(() => setShowHeader(true), 300);
    const t3 = setTimeout(() => setShowBidVsReality(true), 700);
    const t4 = setTimeout(() => setShowResult(true), 1200);
    const t5 = setTimeout(() => setShowDice(true), 1700);
    const t6 = setTimeout(() => setShowActions(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6); };
  }, [challenge]);

  if (!challenge) return null;

  const caller = gameState.players.find((p) => p.id === challenge.callerId);
  const bidder = gameState.players.find((p) => p.id === challenge.bidderId);
  const loser = gameState.players.find((p) => p.id === challenge.loserId);
  const highlightFace = challenge.contestedBid.faceValue;

  const resultIcon = challenge.isSpotOn
    ? <Target className="size-12 text-amber-500" />
    : challenge.isChallengeCorrect
      ? <CheckCircle className="size-12 text-green-500" />
      : <XCircle className="size-12 text-destructive" />;

  const resultTitle = challenge.isSpotOn
    ? t("spotOn")
    : challenge.isChallengeCorrect
      ? t("challengeSuccess")
      : t("challengeFailed");

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-500",
        showOverlay ? "bg-black/70 backdrop-blur-sm" : "bg-black/0",
      )}
    >
      <div
        className={cn(
          "relative mx-4 flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-3xl border-2 border-orange-500 bg-card/95 p-5 shadow-2xl shadow-orange-500/20 transition-all duration-500",
          showOverlay
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 translate-y-8",
        )}
      >
        {/* ── Surrender button ── */}
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <Flag className="size-3.5" />
                {tSurrender("button")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tSurrender("title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {tSurrender("description", { eloNote: isRanked ? " Your ELO will be affected." : "" })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tSurrender("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onSurrender}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {tSurrender("confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* ── Header: Challenger vs Bidder ── */}
        <div
          className={cn(
            "flex flex-col items-center gap-2 transition-all duration-500",
            showHeader ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <Swords className="size-6 text-orange-500" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{caller?.displayName}</span>
            {" "}vs{" "}
            <span className="font-semibold text-foreground">{bidder?.displayName}</span>
          </p>
        </div>

        {/* ── Bid vs Reality ── */}
        <div
          className={cn(
            "flex items-center justify-center gap-4 transition-all duration-500",
            showBidVsReality ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/80 px-5 py-3">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{t("bid")}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tabular-nums">
                {challenge.contestedBid.quantity}
              </span>
              <span className="text-lg text-muted-foreground">&times;</span>
              <DiceFace value={challenge.contestedBid.faceValue} size="md" />
            </div>
          </div>

          <span className="text-lg font-bold text-muted-foreground">vs</span>

          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/80 px-5 py-3">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{t("reality")}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tabular-nums">
                {challenge.actualCount}
              </span>
              <span className="text-lg text-muted-foreground">&times;</span>
              <DiceFace value={challenge.contestedBid.faceValue} size="md" />
            </div>
          </div>
        </div>

        {/* ── Result icon + title + badges ── */}
        <div
          className={cn(
            "flex flex-col items-center gap-3 transition-all duration-700",
            showResult ? "opacity-100 scale-100" : "opacity-0 scale-75",
          )}
        >
          <div className={cn(
            "rounded-full p-3",
            challenge.isSpotOn
              ? "bg-amber-500/15"
              : challenge.isChallengeCorrect
                ? "bg-green-500/15"
                : "bg-destructive/15",
          )}>
            {resultIcon}
          </div>

          <h2 className="text-2xl font-black tracking-tight">{resultTitle}</h2>

          <Badge variant="destructive" className="gap-1 text-sm">
            {t("losesDie", { name: loser?.displayName ?? "" })}
          </Badge>

          {challenge.isSpotOn && challenge.bidderGainedDie && (
            <Badge variant="default" className="gap-1 text-sm bg-amber-500 hover:bg-amber-500/90">
              <Plus className="size-3" />
              {t("bidderGainsDie", { name: bidder?.displayName ?? "" })}
            </Badge>
          )}

          {challenge.isSpotOn && !challenge.bidderGainedDie && (
            <span className="text-xs text-muted-foreground">
              {t("bidderAlreadyMaxDice", { name: bidder?.displayName ?? "" })}
            </span>
          )}
        </div>

        {/* ── Revealed dice ── */}
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-500",
            showDice ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
            {t("revealedDice")}
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {gameState.players.map((player) => {
              const revealedValues = challenge.revealedDice?.[player.id];
              const playerWithDice = revealedValues
                ? { ...player, diceValues: [...revealedValues] }
                : player;
              return (
                <PlayerCard
                  key={player.id}
                  player={playerWithDice}
                  isCurrentTurn={false}
                  isMe={player.id === playerId}
                  highlightFace={highlightFace}
                  showDice
                />
              );
            })}
          </div>
        </div>

        {/* ── Actions ── */}
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-500",
            showActions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          )}
        >
          <Button size="lg" className="w-full gap-2" onClick={onNextRound}>
            <ArrowRight className="size-4" />
            {t("nextRound")}
          </Button>
        </div>
      </div>
    </div>
  );
}
