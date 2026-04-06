"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Dice5, ArrowLeft, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTutorialGame, PLAYER_ID } from "@/features/tutorial/hooks/use-tutorial-game";
import { TutorialOverlay } from "@/features/tutorial/components/tutorial-overlay";
import { BiddingView } from "@/features/game/components/bidding-view";
import { ResultView } from "@/features/game/components/result-view";
import { useGameSounds, SoundControls } from "@/features/sound";
import { TUTORIAL_STEPS } from "@/features/tutorial/tutorial-steps";

export default function TutorialPlayPage() {
  const router = useRouter();
  const t = useTranslations("tutorial");
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

  const {
    gameState,
    currentStep,
    stepIndex,
    isComplete,
    isFreePlay,
    error,
    actions,
  } = useTutorialGame();

  // Sound effects
  useGameSounds(gameState, PLAYER_ID);

  // Show non-hint errors
  useEffect(() => {
    if (error && !error.startsWith("hint:")) {
      toast.error(error);
    }
  }, [error]);

  // Loading
  if (!gameState) {
    return (
      <TutorialLayout onBack={() => router.push("/")}>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </TutorialLayout>
    );
  }

  // Tutorial complete
  if (isComplete) {
    return (
      <TutorialLayout onBack={() => router.push("/")}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
          <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GraduationCap className="size-14" />
          </div>
          <h1 className="text-3xl font-bold">{t("congratulations")}</h1>
          <p className="max-w-md text-center text-muted-foreground">
            {t("completedDesc")}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push("/training")}
            >
              {t("goToTraining")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              {t("goToHome")}
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full"
              onClick={actions.restart}
            >
              {t("restartTutorial")}
            </Button>
          </div>
        </div>
      </TutorialLayout>
    );
  }

  // Game content
  const content = (() => {
    switch (gameState.phase) {
      case "LOBBY":
        // Lobby is skipped — overlay handles welcome
        return (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            {t("preparingGame")}
          </div>
        );

      case "ROLLING":
      case "BIDDING":
        return (
          <BiddingView
            gameState={gameState}
            playerId={PLAYER_ID}
            onPlaceBid={async (q, f) => { actions.placeBid(q, f); }}
            onCallChallenge={async () => { actions.callChallenge(); }}
            onSurrender={async () => {}}
            isRanked={false}
          />
        );

      case "CHALLENGE":
      case "RESULT":
        return (
          <ResultView
            gameState={gameState}
            playerId={PLAYER_ID}
            onNextRound={isFreePlay ? async () => { actions.nextRound(); } : async () => {}}
            onSurrender={async () => {}}
            isRanked={false}
          />
        );

      case "GAME_OVER":
        return (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        );

      default:
        return null;
    }
  })();

  return (
    <TutorialLayout onBack={() => router.push("/")}>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        {content}
      </div>

      {/* Tutorial overlay (spotlight + tooltip) */}
      {!isFreePlay && (
        <TutorialOverlay
          step={currentStep}
          onAdvance={actions.advanceStep}
          onSkip={() => router.push("/")}
          stepIndex={stepIndex}
          totalSteps={TUTORIAL_STEPS.length}
          error={error}
        />
      )}
    </TutorialLayout>
  );
}

// ── Layout wrapper ──
function TutorialLayout({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack: () => void;
}) {
  const t = useTranslations("tutorial");

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Dice5 className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Dixo</span>
        </div>
        <Badge variant="secondary" className="ml-2 gap-1">
          <GraduationCap className="size-3" />
          {t("badge")}
        </Badge>
        <div className="ml-auto">
          <SoundControls />
        </div>
      </header>
      {children}
    </div>
  );
}
