"use client";

import { useRouter } from "next/navigation";
import { Trophy, Home, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicGameState } from "@/types/api";

interface GameOverViewProps {
  gameState: PublicGameState;
  playerId: string;
}

export function GameOverView({ gameState, playerId }: GameOverViewProps) {
  const router = useRouter();
  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const isWinner = gameState.winnerId === playerId;
  const isRanked = gameState.gameMode === "RANKED";
  const eloChanges = gameState.eloChanges;

  // Trouver l'ELO change pour le joueur actuel
  const myEloChange = eloChanges?.find((e) => e.playerId === playerId);

  return (
    <div className="flex flex-col items-center gap-6 p-4 py-12">
      {/* ── Animation trophée ── */}
      <div className="flex size-24 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        <Trophy className="size-14" />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">
          {isWinner ? "You won!" : "Game over"}
        </h1>

        {/* ── ELO Change personnel ── */}
        {isRanked && myEloChange && (
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <span className="text-sm text-muted-foreground">ELO</span>
            <span className="font-mono text-lg font-bold">
              {myEloChange.newElo}
            </span>
            <Badge
              variant={myEloChange.delta > 0 ? "default" : myEloChange.delta < 0 ? "destructive" : "secondary"}
              className="gap-1"
            >
              {myEloChange.delta > 0 ? (
                <TrendingUp className="size-3" />
              ) : myEloChange.delta < 0 ? (
                <TrendingDown className="size-3" />
              ) : (
                <Minus className="size-3" />
              )}
              {myEloChange.delta > 0 ? "+" : ""}
              {myEloChange.delta}
            </Badge>
          </div>
        )}

        {winner && (
          <div className="flex items-center gap-3 rounded-xl border bg-card px-6 py-4 shadow-sm">
            <Avatar>
              <AvatarImage src={winner.avatarUrl} alt={winner.displayName} />
              <AvatarFallback>
                {winner.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-lg font-bold">{winner.displayName}</span>
              <span className="text-sm text-muted-foreground">
                Round {gameState.round} winner
              </span>
            </div>
            <Trophy className="size-6 text-amber-500" />
          </div>
        )}
      </div>

      {/* ── Classement final ── */}
      <div className="w-full max-w-sm rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Final ranking
        </h3>
        <div className="flex flex-col gap-2">
          {[...gameState.players]
            .sort((a, b) => {
              if (a.id === gameState.winnerId) return -1;
              if (b.id === gameState.winnerId) return 1;
              return b.diceCount - a.diceCount;
            })
            .map((player, index) => {
              const eloChange = eloChanges?.find(
                (e) => e.playerId === player.id,
              );

              return (
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
                    #{index + 1}
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

                  {/* ELO delta (si classée) */}
                  {isRanked && eloChange && (
                    <span
                      className={`text-xs font-semibold ${
                        eloChange.delta > 0
                          ? "text-green-500"
                          : eloChange.delta < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {eloChange.delta > 0 ? "+" : ""}
                      {eloChange.delta}
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {player.diceCount} die{player.diceCount !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Mode de jeu ── */}
      {isRanked && (
        <Badge variant="outline" className="gap-1">
          <Trophy className="size-3" />
          Ranked game
        </Badge>
      )}

      <Button
        size="lg"
        className="w-full max-w-sm gap-2"
        onClick={() => router.push("/")}
      >
        <Home className="size-4" />
        Retour à l&apos;accueil
      </Button>
    </div>
  );
}
