"use client";

import { cn } from "@/lib/utils";
import { Crown, Skull, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PublicPlayerInfo } from "@/types/api";
import { HiddenDice, DiceRow } from "./dice-face";

interface PlayerCardProps {
  player: PublicPlayerInfo;
  isCurrentTurn: boolean;
  isMe: boolean;
  /** Face à mettre en surbrillance (enchère courante) */
  highlightFace?: number;
  /** Montrer les dés (phase de révélation) */
  showDice?: boolean;
  className?: string;
}

export function PlayerCard({
  player,
  isCurrentTurn,
  isMe,
  highlightFace,
  showDice = false,
  className,
}: PlayerCardProps) {
  const hasDice = player.diceValues.length > 0;
  const initials = player.displayName.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border p-3 transition-all",
        isCurrentTurn && player.isAlive
          ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/30"
          : "border-border bg-card",
        !player.isAlive && "opacity-50",
        isMe && "ring-2 ring-primary/20",
        className,
      )}
    >
      {/* ─── En-tête joueur ─── */}
      <div className="flex items-center gap-2.5">
        <Avatar size="sm">
          <AvatarImage src={player.avatarUrl} alt={player.displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "truncate text-sm font-medium",
                !player.isAlive && "line-through text-muted-foreground",
              )}
            >
              {player.displayName}
            </span>
            {player.subscription === "premium" && (
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
            )}
            {isMe && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Vous
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {player.isHost && (
              <Crown className="size-3 text-amber-500" />
            )}
            {!player.isAlive && (
              <Skull className="size-3 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground">
              {player.isAlive
                ? `${player.diceCount} dé${player.diceCount > 1 ? "s" : ""}`
                : "Éliminé"}
            </span>
          </div>
        </div>

        {isCurrentTurn && player.isAlive && (
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        )}
      </div>

      {/* ─── Dés ─── */}
      {player.isAlive && (
        <div className="min-h-[36px]">
          {isMe && hasDice ? (
            <DiceRow
              values={[...player.diceValues]}
              size="sm"
              highlightFace={highlightFace}
              skin={player.diceSkin}
            />
          ) : showDice && hasDice ? (
            <DiceRow
              values={[...player.diceValues]}
              size="sm"
              highlightFace={highlightFace}
              skin={player.diceSkin}
            />
          ) : (
            <HiddenDice count={player.diceCount} size="sm" />
          )}
        </div>
      )}
    </div>
  );
}
