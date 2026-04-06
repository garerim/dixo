"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flag, Skull, Crown, Star, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicGameState, PublicPlayerInfo } from "@/types/api";
import { BidPanel } from "./bid-panel";
import { DiceFace, DiceRow } from "./dice-face";
import { DiceRollAnimation, useDiceRollAnimation } from "./dice-roll-animation";
import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";

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
  const isMobile = useIsMobile();
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const me = gameState.players.find((p) => p.id === playerId);

  const totalDice = gameState.players.reduce(
    (sum, p) => (p.isAlive ? sum + p.diceCount : sum),
    0,
  );

  const canChallenge =
    gameState.currentBid !== null &&
    gameState.currentBid.playerId !== playerId;

  const highlightFace = gameState.currentBid?.faceValue;

  const { isAnimating, handleComplete } = useDiceRollAnimation(gameState.round);
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [bidPanelOpen, setBidPanelOpen] = useState(true);

  const totalPlayers = gameState.players.length;
  const opponents = gameState.players.filter((p) => p.id !== playerId);
  const device = isMobile ? "mobile" : "desktop";
  const bgSrc = `/bg-table/bg-table-${totalPlayers}-${device}.png`;

  // Get seat positions: last position = me (bottom), rest = opponents clockwise from top
  const positions = SEAT_POSITIONS[totalPlayers]?.[device] ?? SEAT_POSITIONS[2][device];
  const mySeatPos = positions[positions.length - 1];
  const opponentPositions = positions.slice(0, positions.length - 1);

  return (
    <div className="relative flex-1 min-h-0">
      {/* ── Header overlay ── */}
      <div className="absolute top-2 left-2 right-2 z-30 flex items-center gap-2">
        <Badge variant="secondary" className="gap-1 bg-card/80 backdrop-blur-sm">
          {t("round", { round: gameState.round })}
        </Badge>
        <div className="ml-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5 shadow-lg">
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

      {/* ── Game Table — fullscreen background ── */}
      <div className="absolute inset-0 overflow-hidden"
      >
        {/* Background image */}
        <Image
          src={bgSrc}
          alt="Game table"
          fill
          className="object-cover"
          priority
          draggable={false}
        />

        {/* ── Center: Turn badge + Current bid ── */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-2"
          style={{ top: totalPlayers === 2 && !isMobile ? "53%" : "50%" }}
        >
          <Badge
            variant={isMyTurn ? "default" : "outline"}
            className="gap-1.5"
          >
            {!isMyTurn && (
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
            )}
            {isMyTurn
              ? t("yourTurn")
              : t("playerTurn", { name: currentPlayer?.displayName ?? "..." })}
          </Badge>

          {gameState.currentBid ? (
            <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-black/50 backdrop-blur-md border-2 border-orange-500 px-5 py-3 shadow-lg shadow-orange-500/10">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                {t("currentBid")}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black tabular-nums">
                  {gameState.currentBid.quantity}
                </span>
                <span className="text-xl text-muted-foreground">&times;</span>
                <DiceFace value={gameState.currentBid.faceValue} size="lg" />
              </div>
              <span className="text-sm font-bold text-white">
                {totalDice} {t("totalDice")}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-black/50 backdrop-blur-md border-2 border-dashed border-orange-500/50 px-5 py-3">
              <span className="text-xs text-muted-foreground">
                {t("currentBid")}
              </span>
              <span className="text-sm font-bold text-white">
                {totalDice} {t("totalDice")}
              </span>
            </div>
          )}
        </div>

        {/* ── Opponent seats ── */}
        {opponents.map((player, i) => {
          const pos = opponentPositions[i];
          if (!pos) return null;
          const color = SEAT_COLORS[totalPlayers]?.[i] ?? "border-border";
          return (
            <div
              key={player.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <TableSeat
                player={player}
                isCurrentTurn={
                  gameState.players[gameState.currentPlayerIndex]?.id === player.id
                }
                borderColor={color}
              />
            </div>
          );
        })}

        {/* ── My seat ── */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: `${mySeatPos.x}%`, top: `${mySeatPos.y}%` }}
        >
          <div className={cn(
            "flex flex-col items-center gap-1 rounded-2xl border-2 bg-black/40 backdrop-blur-md px-3 py-2 shadow-lg transition-all",
            isMyTurn
              ? "ring-2 ring-primary/40"
              : "",
            SEAT_COLORS[totalPlayers]?.[totalPlayers - 1] ?? "border-green-500",
          )}>
            <div className="flex items-center gap-1.5">
              <Avatar size="sm">
                <AvatarImage src={me?.avatarUrl} alt={me?.displayName} />
                <AvatarFallback>{me?.displayName?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold">{me?.displayName}</span>
              {me?.subscription === "premium" && (
                <Star className="size-3 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            {me && me.diceValues.length > 0 && (
              <button
                data-tutorial-id="my-dice"
                onClick={() => setDiceModalOpen(true)}
                className="flex items-center gap-0.5 rounded-lg px-1 py-0.5 transition-colors hover:bg-muted/50 cursor-pointer"
                title={t("yourDice")}
              >
                {isAnimating ? (
                  <DiceRollAnimation
                    finalValues={me.diceValues}
                    skin={me.diceSkin}
                    duration={1200}
                    onComplete={handleComplete}
                    className="gap-0.5"
                  />
                ) : (
                  <DiceRow
                    values={[...me.diceValues]}
                    size="sm"
                    highlightFace={highlightFace}
                    skin={me.diceSkin}
                  />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Dice modal (large view) ── */}
      <Dialog open={diceModalOpen} onOpenChange={setDiceModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("yourDice")}</DialogTitle>
          </DialogHeader>
          {me && me.diceValues.length > 0 && (
            <div className="flex justify-center py-4">
              <DiceRow
                values={[...me.diceValues]}
                size="lg"
                highlightFace={highlightFace}
                skin={me.diceSkin}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Bid panel toggle button ── */}
      {isMyTurn && me?.isAlive && !bidPanelOpen && (
        <Button
          onClick={() => setBidPanelOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[22rem] z-50 gap-2 shadow-lg shadow-primary/20 px-5 py-3 h-auto text-base"
        >
          <ChevronUp className="size-4" />
          {t("showBidPanel")}
        </Button>
      )}

      {/* ── Bid panel ── */}
      {isMyTurn && me?.isAlive && bidPanelOpen && (
        <div
          data-tutorial-id="bid-panel"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[22rem] z-50 w-96 max-w-[calc(100vw-2rem)]"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBidPanelOpen(false)}
            className="mb-2 ml-auto flex gap-1.5 bg-card/95 backdrop-blur-sm shadow-lg"
          >
            <ChevronDown className="size-3.5" />
            {t("hideBidPanel")}
          </Button>
          <BidPanel
            currentBid={gameState.currentBid}
            totalDice={totalDice}
            onPlaceBid={onPlaceBid}
            onCallChallenge={onCallChallenge}
            canChallenge={canChallenge}
            className="shadow-xl shadow-black/30 border-primary/20"
          />
        </div>
      )}

      {/* ── Waiting indicator ── */}
      {!isMyTurn && gameState.currentBid && (
        <div data-tutorial-id="current-bid" className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[22rem] z-50">
          <div className="flex items-center gap-2 rounded-xl bg-card/95 backdrop-blur-sm border px-4 py-3 shadow-xl shadow-black/30">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span className="text-sm text-muted-foreground">
              {t("waitingFor", { name: currentPlayer?.displayName ?? "..." })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Table seat: compact player display ─── */

function TableSeat({
  player,
  isCurrentTurn,
  borderColor,
}: {
  player: PublicPlayerInfo;
  isCurrentTurn: boolean;
  borderColor: string;
}) {
  const t = useTranslations("game.player");
  const initials = player.displayName.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border-2 bg-black/40 backdrop-blur-md px-3 py-2 shadow-lg transition-all",
        borderColor,
        isCurrentTurn && player.isAlive && "ring-2 ring-primary/40",
        !player.isAlive && "opacity-40",
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar size="sm">
          <AvatarImage src={player.avatarUrl} alt={player.displayName} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        {isCurrentTurn && player.isAlive && (
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        )}
        {!player.isAlive && (
          <span className="absolute -top-0.5 -right-0.5">
            <Skull className="size-3 text-destructive" />
          </span>
        )}
      </div>

      {/* Name + dice count */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <span className={cn(
            "truncate text-xs font-semibold",
            !player.isAlive && "line-through text-muted-foreground",
          )}>
            {player.displayName}
          </span>
          {player.subscription === "premium" && (
            <Star className="size-2.5 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
          {player.isHost && (
            <Crown className="size-2.5 shrink-0 text-amber-500" />
          )}
        </div>
        <span className={cn(
          "font-bold",
          player.isAlive ? "text-xs text-white" : "text-[10px] text-muted-foreground",
        )}>
          {player.isAlive
            ? (player.diceCount > 1
              ? t("diceCount", { count: player.diceCount })
              : t("dieCount", { count: player.diceCount }))
            : t("eliminated")}
        </span>
      </div>
    </div>
  );
}

/* ─── Seat colors matching cup colors from bg-table images ─── */
const SEAT_COLORS: Record<number, string[]> = {
  2: ["border-red-500", "border-blue-500"],
  3: ["border-red-500", "border-blue-500", "border-green-500"],
  4: ["border-orange-500", "border-purple-500", "border-red-500", "border-green-500"],
  5: ["border-green-500", "border-orange-500", "border-purple-500", "border-blue-500", "border-red-500"],
  6: ["border-red-500", "border-yellow-500", "border-orange-500", "border-purple-500", "border-blue-500", "border-green-500"],
};

/* ─── Seat positions per player count ─── */
/* Ordered: [opponent seats clockwise from top..., my seat (bottom-most)] */

type Pos = { x: number; y: number };

const SEAT_POSITIONS: Record<number, Record<string, Pos[]>> = {
  2: {
    desktop: [
      { x: 50, y: 28 },   // opponent: top center
      { x: 50, y: 80 },   // me: bottom center
    ],
    mobile: [
      { x: 50, y: 30 },   // opponent: top
      { x: 50, y: 72 },   // me: bottom
    ],
  },
  3: {
    desktop: [
      { x: 32, y: 38 },   // opponent: top-left
      { x: 68, y: 38 },   // opponent: top-right
      { x: 50, y: 80 },   // me: bottom center
    ],
    mobile: [
      { x: 35, y: 30 },   // opponent: top-left
      { x: 65, y: 30 },   // opponent: top-right
      { x: 50, y: 72 },   // me: bottom center
    ],
  },
  4: {
    desktop: [
      { x: 37, y: 28 },   // opponent: top-left
      { x: 63, y: 28 },   // opponent: top-right
      { x: 65, y: 68 },   // opponent: bottom-right
      { x: 35, y: 68 },   // me: bottom-left
    ],
    mobile: [
      { x: 35, y: 25 },   // opponent: top-left
      { x: 65, y: 25 },   // opponent: top-right
      { x: 63, y: 65 },   // opponent: bottom-right
      { x: 37, y: 65 },   // me: bottom-left
    ],
  },
  5: {
    desktop: [
      { x: 22, y: 48 },   // opponent: left
      { x: 40, y: 22 },   // opponent: top-left
      { x: 65, y: 22 },   // opponent: top-right
      { x: 78, y: 48 },   // opponent: right
      { x: 50, y: 80 },   // me: bottom center
    ],
    mobile: [
      { x: 22, y: 45 },   // opponent: left
      { x: 38, y: 22 },   // opponent: top-left
      { x: 62, y: 22 },   // opponent: top-right
      { x: 78, y: 45 },   // opponent: right
      { x: 50, y: 75 },   // me: bottom center
    ],
  },
  6: {
    desktop: [
      { x: 22, y: 55 },   // opponent: left
      { x: 28, y: 25 },   // opponent: top-left
      { x: 55, y: 18 },   // opponent: top
      { x: 75, y: 30 },   // opponent: top-right
      { x: 75, y: 62 },   // opponent: right
      { x: 50, y: 82 },   // me: bottom center
    ],
    mobile: [
      { x: 22, y: 52 },   // opponent: left
      { x: 28, y: 25 },   // opponent: top-left
      { x: 55, y: 18 },   // opponent: top
      { x: 73, y: 28 },   // opponent: top-right
      { x: 73, y: 58 },   // opponent: right
      { x: 50, y: 78 },   // me: bottom center
    ],
  },
};
