"use client";

import { useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useBotGame } from "@/features/game/hooks/use-bot-game";
import { BiddingView } from "@/features/game/components/bidding-view";
import { ResultView } from "@/features/game/components/result-view";
import { TrainingGameOverView } from "./training-game-over";
import { useGameSounds, SoundControls } from "@/features/sound";
import type { BotDifficulty } from "@/core/bot";

function TrainingPlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isLoading: authLoading } = useAuth();
  const t = useTranslations("training");

  // Parse search params
  const rawBots = Number(searchParams.get("bots")) || 1;
  const botCount = (rawBots >= 1 && rawBots <= 5 ? rawBots : 1) as 1 | 2 | 3 | 4 | 5;
  const difficulty = (searchParams.get("difficulty") ?? "medium") as BotDifficulty;
  const diceCount = Number(searchParams.get("dice")) || 5;
  const pacosWild = searchParams.get("pacos") !== "false";

  const playerInfo = useMemo(
    () => ({
      id: user?.id ?? "human-player",
      displayName:
        profile?.pseudo ??
        user?.user_metadata?.full_name ??
        "Player",
      avatarUrl:
        profile?.avatarUrl ??
        user?.user_metadata?.avatar_url,
      subscription: profile?.subscription,
      diceSkin: profile?.diceSkin ?? undefined,
    }),
    [user, profile],
  );

  const { gameState, error, actions } = useBotGame({
    player: playerInfo,
    botCount,
    difficulty,
    config: {
      initialDiceCount: diceCount,
      pacosAreWild: pacosWild,
    },
  });

  // Start game immediately once state is ready
  useEffect(() => {
    if (gameState?.phase === "LOBBY") {
      actions.startGame();
    }
  }, [gameState?.phase, actions]);

  // Trigger sound effects
  useGameSounds(gameState, playerInfo.id);

  // Show errors
  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Loading
  if (authLoading || !gameState || gameState.phase === "LOBBY") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading training...</p>
      </div>
    );
  }

  const handleSurrender = async () => {
    await actions.surrender();
    toast.info("You have surrendered.");
  };

  // Phase rendering
  const content = (() => {
    switch (gameState.phase) {
      case "ROLLING":
      case "BIDDING":
        return (
          <BiddingView
            gameState={gameState}
            playerId={playerInfo.id}
            onPlaceBid={actions.placeBid}
            onCallChallenge={actions.callChallenge}
            onSurrender={handleSurrender}
            isRanked={false}
          />
        );

      case "CHALLENGE":
      case "RESULT":
        return (
          <>
            <BiddingView
              gameState={gameState}
              playerId={playerInfo.id}
              onPlaceBid={actions.placeBid}
              onCallChallenge={actions.callChallenge}
              onSurrender={handleSurrender}
              isRanked={false}
            />
            <ResultView
              gameState={gameState}
              playerId={playerInfo.id}
              onNextRound={actions.nextRound}
              onSurrender={handleSurrender}
              isRanked={false}
            />
          </>
        );

      case "GAME_OVER":
        return (
          <TrainingGameOverView
            gameState={gameState}
            playerId={playerInfo.id}
            onPlayAgain={actions.restart}
            onChangeSettings={() => router.push("/training")}
            onBackToMenu={() => router.push("/")}
          />
        );

      default:
        return null;
    }
  })();

  const isFullscreenPhase = gameState.phase === "BIDDING" || gameState.phase === "ROLLING" || gameState.phase === "CHALLENGE" || gameState.phase === "RESULT";

  return (
    <div className={`flex flex-1 flex-col min-h-0 ${isFullscreenPhase ? "" : "overflow-y-auto p-4"}`}>
      {content}
    </div>
  );
}

export default function TrainingPlayPage() {
  const router = useRouter();
  const t = useTranslations("training");
  const { setTheme, resolvedTheme } = useTheme();
  const previousThemeRef = useRef<string | null>(null);

  useEffect(() => {
    previousThemeRef.current = resolvedTheme ?? "light";
    setTheme("dark");
    return () => {
      setTheme(previousThemeRef.current ?? "light");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/training")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Dixo" width={28} height={28} className="rounded-md" />
          <span className="text-lg font-bold tracking-tight">Dixo</span>
        </div>
        <Badge variant="secondary" className="ml-2 gap-1">
          <Bot className="size-3" />
          {t("badge")}
        </Badge>
        <div className="ml-auto">
          <SoundControls />
        </div>
      </header>

      {/* ── Content ── */}
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <TrainingPlayContent />
      </Suspense>
    </div>
  );
}
