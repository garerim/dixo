"use client";

import { use, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Dice5, ArrowLeft, Loader2, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useGame } from "@/features/game/hooks/use-game";
import { LobbyView } from "@/features/game/components/lobby-view";
import { BiddingView } from "@/features/game/components/bidding-view";
import { ResultView } from "@/features/game/components/result-view";
import { GameOverView } from "@/features/game/components/game-over-view";
import { GameChat } from "@/features/game/components/game-chat";
import { useGameSounds, SoundControls } from "@/features/sound";

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gameId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const previousThemeRef = useRef<string | null>(null);

  // Forcer le dark mode en partie, restaurer le thème en quittant
  useEffect(() => {
    previousThemeRef.current = resolvedTheme ?? "light";
    setTheme("dark");
    return () => {
      setTheme(previousThemeRef.current ?? "light");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rediriger si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const playerId = user?.id ?? "";
  const onBackRef = useRef<(() => void) | null>(null);

  const handleBack = useCallback(() => {
    if (onBackRef.current) {
      onBackRef.current();
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Dice5 className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Dixo</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Chat button — mobile only */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileChatOpen(true)}
            className="lg:hidden"
          >
            <MessageSquare className="size-4" />
          </Button>
          <SoundControls />
        </div>
      </header>

      {/* ── Contenu ── */}
      {authLoading || !user ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <GameContent
          gameId={gameId}
          playerId={playerId}
          router={router}
          onBackRef={onBackRef}
          mobileChatOpen={mobileChatOpen}
          onCloseMobileChat={() => setMobileChatOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Composant interne qui utilise le hook useGame ───
function GameContent({
  gameId,
  playerId,
  router,
  onBackRef,
  mobileChatOpen,
  onCloseMobileChat,
}: {
  gameId: string;
  playerId: string;
  router: ReturnType<typeof useRouter>;
  onBackRef: React.MutableRefObject<(() => void) | null>;
  mobileChatOpen: boolean;
  onCloseMobileChat: () => void;
}) {
  const { gameState, isLoading, error, actions } = useGame({
    gameId,
    playerId,
  });

  // Trigger sound effects based on game state changes
  useGameSounds(gameState, playerId);

  // ── Auto-leave lobby on page unload (non-host, LOBBY phase, PRIVATE) ──
  const canAutoLeave = useCallback(() => {
    if (!gameState) return false;
    if (gameState.phase !== "LOBBY") return false;
    const me = gameState.players.find((p) => p.id === playerId);
    return me ? !me.isHost : false;
  }, [gameState, playerId]);

  // Keep a ref so the beforeunload handler always has the latest value
  const canAutoLeaveRef = useRef(canAutoLeave);
  canAutoLeaveRef.current = canAutoLeave;

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (canAutoLeaveRef.current()) {
        // Use sendBeacon for reliable fire-and-forget on page close
        navigator.sendBeacon(
          "/api/game/leave",
          new Blob(
            [JSON.stringify({ gameId })],
            { type: "application/json" },
          ),
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameId]);

  const handleLeaveGame = useCallback(async () => {
    const ok = await actions.leaveGame();
    if (ok) router.push("/");
    return ok;
  }, [actions, router]);

  // ── Register back button handler: leave game when in lobby as non-host ──
  useEffect(() => {
    if (canAutoLeave()) {
      onBackRef.current = () => {
        handleLeaveGame();
      };
    } else {
      onBackRef.current = null;
    }
    return () => {
      onBackRef.current = null;
    };
  }, [canAutoLeave, handleLeaveGame, onBackRef]);

  // ── Erreur ──
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // ── Loading ──
  if (isLoading || !gameState) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Loading game...
        </p>
      </div>
    );
  }

  const handleSurrender = async () => {
    await actions.surrender();
    toast.info("You have surrendered the game.");
  };

  // ── Phase du jeu → Vue correspondante ──
  const content = (() => {
    switch (gameState.phase) {
      case "LOBBY":
        return (
          <LobbyView
            gameState={gameState}
            playerId={playerId}
            onStartGame={actions.startGame}
            onUpdateSettings={actions.updateSettings}
            onLeaveGame={handleLeaveGame}
          />
        );

      case "ROLLING":
      case "BIDDING":
        return (
          <BiddingView
            gameState={gameState}
            playerId={playerId}
            onPlaceBid={actions.placeBid}
            onCallChallenge={actions.callChallenge}
            onSurrender={handleSurrender}
            isRanked={gameState.gameMode === "RANKED"}
          />
        );

      case "CHALLENGE":
      case "RESULT":
        return (
          <ResultView
            gameState={gameState}
            playerId={playerId}
            onNextRound={actions.nextRound}
            onSurrender={handleSurrender}
            isRanked={gameState.gameMode === "RANKED"}
          />
        );

      case "GAME_OVER":
        return (
          <GameOverView gameState={gameState} playerId={playerId} />
        );

      default:
        return (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Unknown phase: {gameState.phase}
          </div>
        );
    }
  })();

  // ── Mobile chat: full-screen overlay ──
  if (mobileChatOpen) {
    return (
      <div className="flex flex-1 flex-col min-h-0 lg:hidden">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <span className="font-semibold">Chat</span>
          <Button variant="ghost" size="icon-sm" onClick={onCloseMobileChat}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <GameChat
            gameId={gameId}
            className="border-0 shadow-none rounded-none h-full"
            hideHeader={true}
            fullHeight={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-4 p-4 overflow-hidden min-h-0">
      {/* ── Contenu principal ── */}
      <div className="flex flex-1 flex-col overflow-y-auto min-h-0">
        {content}
      </div>

      {/* ── Chat (sur le côté desktop) ── */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col min-h-0">
        <GameChat gameId={gameId} fullHeight />
      </div>
    </div>
  );
}
