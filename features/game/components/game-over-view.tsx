"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Home,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicGameState } from "@/types/api";
import { gameClient } from "@/features/game/api/game-client";
import {
  subscribeToRematch,
  type RematchHandle,
  type RematchRequestPayload,
  type RematchAcceptedPayload,
} from "@/lib/realtime/rematch-channel";

interface GameOverViewProps {
  gameState: PublicGameState;
  playerId: string;
}

// =============================================================================
// Rematch states
// =============================================================================

type RematchStatus =
  | "idle"             // No rematch requested
  | "sent"             // I sent a request, waiting for opponent
  | "received"         // Opponent sent a request, waiting for my answer
  | "accepted"         // Rematch accepted, creating/joining game
  | "declined";        // Opponent declined

export function GameOverView({ gameState, playerId }: GameOverViewProps) {
  const t = useTranslations("game.gameOver");
  const router = useRouter();
  const winner = gameState.players.find((p) => p.id === gameState.winnerId);
  const isWinner = gameState.winnerId === playerId;
  const isRanked = gameState.gameMode === "RANKED";
  const eloChanges = gameState.eloChanges;
  const myEloChange = eloChanges?.find((e) => e.playerId === playerId);

  // 1v1 rematch logic
  const is1v1 = gameState.players.length === 2;
  const opponent = gameState.players.find((p) => p.id !== playerId);
  const me = gameState.players.find((p) => p.id === playerId);

  const [rematchStatus, setRematchStatus] = useState<RematchStatus>("idle");
  const [requesterName, setRequesterName] = useState("");
  const handleRef = useRef<RematchHandle | null>(null);
  const myDisplayName = me?.displayName ?? "Player";

  // Subscribe to rematch events — single shared channel for send + receive
  useEffect(() => {
    if (!is1v1) return;

    const handle = subscribeToRematch(
      gameState.id,
      (event, payload) => {
        if (event === "rematch_request") {
          const req = payload as RematchRequestPayload;
          if (req.requesterId !== playerId) {
            setRequesterName(req.requesterName);
            setRematchStatus("received");
          }
        } else if (event === "rematch_accepted") {
          const acc = payload as RematchAcceptedPayload;
          setRematchStatus("accepted");
          gameClient
            .joinGame({
              joinCode: acc.joinCode,
              displayName: myDisplayName,
            })
            .then((res) => {
              if (res.success) {
                router.push(`/game/${acc.gameId}`);
              } else {
                toast.error(res.error ?? "Failed to join rematch game.");
                setRematchStatus("idle");
              }
            });
        } else if (event === "rematch_declined") {
          const req = payload as RematchRequestPayload;
          if (req.requesterId !== playerId) {
            setRematchStatus("declined");
          }
        }
      },
    );

    handleRef.current = handle;

    return () => {
      handle.unsubscribe();
      handleRef.current = null;
    };
  }, [gameState.id, is1v1, playerId, myDisplayName, router]);

  // Send rematch request
  const handleRequestRematch = useCallback(async () => {
    setRematchStatus("sent");
    await handleRef.current?.send("rematch_request", {
      requesterId: playerId,
      requesterName: myDisplayName,
    });
  }, [playerId, myDisplayName]);

  // Accept rematch — create a new game and broadcast the new game info
  const handleAcceptRematch = useCallback(async () => {
    setRematchStatus("accepted");

    // Create a new game with the same mode
    const createRes = await gameClient.createGame({
      displayName: myDisplayName,
      gameMode: gameState.gameMode,
    });

    if (!createRes.success || !createRes.data) {
      toast.error(createRes.error ?? "Failed to create rematch game.");
      setRematchStatus("received");
      return;
    }

    const { gameId: newGameId, joinCode } = createRes.data;

    // Copy settings from the original game (dice count, pacos, timer, max players)
    const cfg = gameState.config;
    await gameClient.updateSettings({
      gameId: newGameId,
      initialDiceCount: cfg.initialDiceCount as 3 | 5 | 7,
      pacosAreWild: cfg.pacosAreWild,
      turnTimer: cfg.turnTimer as null | 15 | 30 | 60,
      maxPlayers: cfg.maxPlayers,
    });

    // Broadcast accepted event so the opponent can join
    await handleRef.current?.send("rematch_accepted", {
      gameId: newGameId,
      joinCode,
    });

    // Navigate to the new game
    router.push(`/game/${newGameId}`);
  }, [gameState.gameMode, gameState.config, myDisplayName, router]);

  // Decline rematch
  const handleDeclineRematch = useCallback(async () => {
    setRematchStatus("idle");
    await handleRef.current?.send("rematch_declined", {
      requesterId: playerId,
      requesterName: myDisplayName,
    });
  }, [playerId, myDisplayName]);

  return (
    <div className="flex flex-col items-center gap-6 p-4 py-12">
      {/* ── Animation trophée ── */}
      <div className="flex size-24 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
        <Trophy className="size-14" />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">
          {isWinner ? t("youWon") : t("gameOver")}
        </h1>

        {/* ── ELO Change personnel ── */}
        {isRanked && myEloChange && (
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <span className="text-sm text-muted-foreground">{t("elo")}</span>
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
                {t("roundWinner", { round: gameState.round })}
              </span>
            </div>
            <Trophy className="size-6 text-amber-500" />
          </div>
        )}
      </div>

      {/* ── Classement final ── */}
      <div className="w-full max-w-sm rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {t("finalRanking")}
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
                    {t("rank", { rank: index + 1 })}
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
                    {player.diceCount} {player.diceCount !== 1 ? t("dice") : t("die")}
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
          {t("ranked")}
        </Badge>
      )}

      {/* ── Rematch (1v1 only) ── */}
      {is1v1 && opponent && (
        <RematchSection
          status={rematchStatus}
          opponentName={opponent.displayName}
          requesterName={requesterName}
          onRequest={handleRequestRematch}
          onAccept={handleAcceptRematch}
          onDecline={handleDeclineRematch}
        />
      )}

      <Button
        size="lg"
        className="w-full max-w-sm gap-2"
        onClick={() => router.push("/")}
      >
        <Home className="size-4" />
        {t("backToHome")}
      </Button>
    </div>
  );
}

// =============================================================================
// RematchSection
// =============================================================================

function RematchSection({
  status,
  opponentName,
  requesterName,
  onRequest,
  onAccept,
  onDecline,
}: {
  status: RematchStatus;
  opponentName: string;
  requesterName: string;
  onRequest: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations("game.gameOver");

  switch (status) {
    case "idle":
      return (
        <Button
          size="lg"
          variant="outline"
          className="w-full max-w-sm gap-2"
          onClick={onRequest}
        >
          <RotateCcw className="size-4" />
          {t("rematch")}
        </Button>
      );

    case "sent":
      return (
        <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("waitingRematch", { name: opponentName })}
          </div>
        </div>
      );

    case "received":
      return (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">
            {t("rematchRequest", { name: requesterName })}
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1.5" onClick={onAccept}>
              <Check className="size-3.5" />
              {t("accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={onDecline}
            >
              <X className="size-3.5" />
              {t("decline")}
            </Button>
          </div>
        </div>
      );

    case "accepted":
      return (
        <div className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border bg-card p-4">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">{t("creatingRematch")}</span>
        </div>
      );

    case "declined":
      return (
        <div className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl border bg-muted/50 p-4">
          <span className="text-sm text-muted-foreground">
            {t("rematchDeclined", { name: opponentName })}
          </span>
        </div>
      );

    default:
      return null;
  }
}
