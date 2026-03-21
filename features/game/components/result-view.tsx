"use client";

import { CheckCircle, XCircle, ArrowRight, Flag } from "lucide-react";
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
  const challenge = gameState.lastChallengeResult;
  if (!challenge) return null;

  const caller = gameState.players.find((p) => p.id === challenge.callerId);
  const bidder = gameState.players.find((p) => p.id === challenge.bidderId);
  const loser = gameState.players.find((p) => p.id === challenge.loserId);

  const highlightFace = challenge.contestedBid.faceValue;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* ── Header avec Surrender ── */}
      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5">
              <Flag className="size-3.5" />
              Surrender
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Surrender the game?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be eliminated and your opponent will win the game.
                {isRanked && " Your ELO will be affected."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onSurrender}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirm surrender
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* ── Résultat du Challenge ── */}
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center">
        {challenge.isChallengeCorrect ? (
          <CheckCircle className="size-10 text-green-500" />
        ) : (
          <XCircle className="size-10 text-destructive" />
        )}

        <h2 className="text-xl font-bold">
          {challenge.isChallengeCorrect ? "Challenge réussi !" : "Challenge raté !"}
        </h2>

        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {caller?.displayName}
          </span>{" "}
          a contesté l&apos;enchère de{" "}
          <span className="font-medium text-foreground">
            {bidder?.displayName}
          </span>
        </p>

        {/* ── Enchère contestée vs Réalité ── */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted px-4 py-3">
            <span className="text-xs text-muted-foreground">Enchère</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold">
                {challenge.contestedBid.quantity} &times;
              </span>
              <DiceFace value={challenge.contestedBid.faceValue} size="sm" />
            </div>
          </div>

          <span className="text-muted-foreground">vs</span>

          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted px-4 py-3">
            <span className="text-xs text-muted-foreground">Réalité</span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold">
                {challenge.actualCount} &times;
              </span>
              <DiceFace value={challenge.contestedBid.faceValue} size="sm" />
            </div>
          </div>
        </div>

        {/* Qui perd */}
        <Badge variant="destructive" className="mt-2 gap-1 text-sm">
          {loser?.displayName} perd un dé !
        </Badge>
      </div>

      {/* ── Tous les dés révélés ── */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
          Dés révélés
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

      {/* ── Bouton round suivant ── */}
      <Button size="lg" className="w-full gap-2" onClick={onNextRound}>
        <ArrowRight className="size-4" />
        Round suivant
      </Button>
    </div>
  );
}
