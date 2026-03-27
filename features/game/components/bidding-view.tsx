"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Flag } from "lucide-react";
import type { PublicGameState } from "@/types/api";
import { PlayerCard } from "./player-card";
import { BidPanel } from "./bid-panel";
import { DiceFace, DiceRow } from "./dice-face";

interface BiddingViewProps {
  gameState: PublicGameState;
  playerId: string;
  onPlaceBid: (quantity: number, faceValue: number) => Promise<void>;
  onCallChallenge: () => Promise<void>;
  onSurrender: () => Promise<void>;
  isRanked: boolean;
}

export function BiddingView({
  gameState,
  playerId,
  onPlaceBid,
  onCallChallenge,
  onSurrender,
  isRanked,
}: BiddingViewProps) {
  const t = useTranslations("game.bidding");
  const tSurrender = useTranslations("game.surrender");
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const me = gameState.players.find((p) => p.id === playerId);

  const totalDice = gameState.players.reduce(
    (sum, p) => (p.isAlive ? sum + p.diceCount : sum),
    0,
  );

  // Peut-on contester ? (il faut une enchère existante qui n'est pas la nôtre)
  const canChallenge =
    gameState.currentBid !== null &&
    gameState.currentBid.playerId !== playerId;

  const highlightFace = gameState.currentBid?.faceValue;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ── Header du round ── */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          {t("round", { round: gameState.round })}
        </Badge>
        <Badge
          variant={isMyTurn ? "default" : "outline"}
          className="gap-1"
        >
          {isMyTurn
            ? t("yourTurn")
            : t("playerTurn", { name: currentPlayer?.displayName ?? "..." })}
        </Badge>
        <div className="ml-auto">
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
      </div>

      {/* ── My dice ── */}
      {me && me.diceValues.length > 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t("yourDice")}
          </span>
          <DiceRow
            values={[...me.diceValues]}
            size="lg"
            highlightFace={highlightFace}
            skin={me.diceSkin}
          />
        </div>
      )}

      {/* ── Opponents ── */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {gameState.players
          .filter((p) => p.id !== playerId)
          .map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={
                gameState.players[gameState.currentPlayerIndex]?.id === player.id
              }
              isMe={false}
              highlightFace={highlightFace}
            />
          ))}
      </div>

      {/* ── Bidding panel (if it's my turn) ── */}
      {isMyTurn && me?.isAlive && (
        <BidPanel
          currentBid={gameState.currentBid}
          totalDice={totalDice}
          onPlaceBid={onPlaceBid}
          onCallChallenge={onCallChallenge}
          canChallenge={canChallenge}
        />
      )}

      {/* ── Waiting (if not my turn) ── */}
      {!isMyTurn && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
          {gameState.currentBid && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("currentBid")}</span>
              <span className="font-bold">{gameState.currentBid.quantity} &times;</span>
              <DiceFace value={gameState.currentBid.faceValue} size="sm" />
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="text-sm">
              {t("waitingFor", { name: currentPlayer?.displayName ?? "..." })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
