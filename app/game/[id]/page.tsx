"use client";

import { use, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dice5, ArrowLeft, Loader2, Flag, MessageSquare } from "lucide-react";
import { toast } from "sonner";
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
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useGame } from "@/features/game/hooks/use-game";
import { LobbyView } from "@/features/game/components/lobby-view";
import { BiddingView } from "@/features/game/components/bidding-view";
import { ResultView } from "@/features/game/components/result-view";
import { GameOverView } from "@/features/game/components/game-over-view";
import { GameChat } from "@/features/game/components/game-chat";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gameId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

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
      </header>

      {/* ── Contenu ── */}
      {authLoading || !user ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <GameContent gameId={gameId} playerId={playerId} router={router} onBackRef={onBackRef} />
          {/* ── Chat mobile ── */}
          <MobileChatDrawer gameId={gameId} />
        </>
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
}: {
  gameId: string;
  playerId: string;
  router: ReturnType<typeof useRouter>;
  onBackRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { gameState, isLoading, error, actions } = useGame({
    gameId,
    playerId,
  });

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

  // ── Erreur ──
  if (error) {
    toast.error(error);
  }

  // La partie est en cours (pas LOBBY, pas GAME_OVER) → on peut abandonner
  const canSurrender =
    gameState.phase !== "LOBBY" && gameState.phase !== "GAME_OVER";

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
          />
        );

      case "CHALLENGE":
      case "RESULT":
        return (
          <ResultView
            gameState={gameState}
            playerId={playerId}
            onNextRound={actions.nextRound}
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

  return (
    <div className="flex flex-1 gap-4 p-4">
      {/* ── Contenu principal ── */}
      <div className="flex flex-1 flex-col">
        {/* ── Bouton Abandonner (flottant en haut) ── */}
        {canSurrender && (
          <div className="mb-2 flex justify-end">
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
                    {gameState.gameMode === "RANKED" &&
                      " Your ELO will be affected."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSurrender}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirm surrender
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {content}
      </div>

      {/* ── Chat (sur le côté desktop) ── */}
      <div className="hidden lg:block">
        <GameChat gameId={gameId} />
      </div>
    </div>
  );
}

// ─── Chat mobile avec Drawer ───
function MobileChatDrawer({ gameId }: { gameId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 shadow-lg transition-all hover:scale-105 lg:hidden">
          <MessageSquare className="size-5 text-primary-foreground" />
          <span className="font-medium text-primary-foreground">Chat</span>
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[80vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Chat</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden min-h-0">
          <GameChat 
            gameId={open ? gameId : null} 
            className="border-0 shadow-none rounded-none h-full" 
            hideHeader={true}
            fullHeight={true}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
