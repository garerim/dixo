"use client";

import { useTranslations } from "next-intl";
import {
  Trophy,
  Home,
  RotateCcw,
  Settings,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicGameState } from "@/types/api";
import { isBotPlayer } from "@/core/bot";

interface TrainingGameOverViewProps {
  gameState: PublicGameState;
  playerId: string;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
  onBackToMenu: () => void;
}

export function TrainingGameOverView({
  gameState,
  playerId,
  onPlayAgain,
  onChangeSettings,
  onBackToMenu,
}: TrainingGameOverViewProps) {
  const t = useTranslations("training");
  const tGame = useTranslations("game.gameOver");

  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const isWinner = gameState.winnerId === playerId;

  return (
    <div className="flex flex-col items-center gap-6 p-4 py-12">
      {/* ── Trophy ── */}
      <div className="flex size-24 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        <Trophy className="size-14" />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">
          {isWinner ? tGame("youWon") : tGame("gameOver")}
        </h1>

        {winner && (
          <div className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 shadow-sm">
            <Avatar>
              <AvatarImage src={winner.avatarUrl} alt={winner.displayName} />
              <AvatarFallback>
                {winner.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">
                  {winner.displayName}
                </span>
                {isBotPlayer(winner.id) && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Bot className="size-3" />
                    Bot
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {tGame("roundWinner", { round: gameState.round })}
              </span>
            </div>
            <Trophy className="size-6 text-amber-500" />
          </div>
        )}
      </div>

      {/* ── Final ranking ── */}
      <div className="w-full max-w-sm rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {tGame("finalRanking")}
        </h3>
        <div className="flex flex-col gap-2">
          {[...gameState.players]
            .sort((a, b) => {
              if (a.id === gameState.winnerId) return -1;
              if (b.id === gameState.winnerId) return 1;
              return b.diceCount - a.diceCount;
            })
            .map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <span
                  className={
                    index === 0
                      ? "text-lg font-bold text-amber-500"
                      : "text-lg font-bold text-muted-foreground"
                  }
                >
                  {tGame("rank", { rank: index + 1 })}
                </span>
                <Avatar className="size-8">
                  <AvatarImage
                    src={player.avatarUrl}
                    alt={player.displayName}
                  />
                  <AvatarFallback>
                    {player.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm font-medium">
                  {player.displayName}
                </span>
                {isBotPlayer(player.id) && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <Bot className="size-3" />
                  </Badge>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Training mode badge */}
      <Badge variant="secondary" className="gap-1">
        <Bot className="size-3" />
        {t("badge")}
      </Badge>

      {/* ── Actions ── */}
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button size="lg" className="w-full gap-2" onClick={onPlayAgain}>
          <RotateCcw className="size-4" />
          {t("playAgain")}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full gap-2"
          onClick={onChangeSettings}
        >
          <Settings className="size-4" />
          {t("changeDifficulty")}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="w-full gap-2"
          onClick={onBackToMenu}
        >
          <Home className="size-4" />
          {t("backToMenu")}
        </Button>
      </div>
    </div>
  );
}
