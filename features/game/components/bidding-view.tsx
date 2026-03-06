"use client";

import { Badge } from "@/components/ui/badge";
import type { PublicGameState } from "@/types/api";
import { PlayerCard } from "./player-card";
import { BidPanel } from "./bid-panel";
import { DiceRow } from "./dice-face";

interface BiddingViewProps {
  gameState: PublicGameState;
  playerId: string;
  onPlaceBid: (quantity: number, faceValue: number) => Promise<void>;
  onCallChallenge: () => Promise<void>;
}

export function BiddingView({
  gameState,
  playerId,
  onPlaceBid,
  onCallChallenge,
}: BiddingViewProps) {
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
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="gap-1">
          Round {gameState.round}
        </Badge>
        <Badge
          variant={isMyTurn ? "default" : "outline"}
          className="gap-1"
        >
          {isMyTurn
            ? "Your turn!"
            : `${currentPlayer?.displayName ?? "..."}'s turn`}
        </Badge>
      </div>

      {/* ── My dice ── */}
      {me && me.diceValues.length > 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Your dice
          </span>
          <DiceRow
            values={[...me.diceValues]}
            size="lg"
            highlightFace={highlightFace}
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
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="text-sm">
            Waiting for {currentPlayer?.displayName}...
          </span>
        </div>
      )}
    </div>
  );
}
