"use client";

import { use, useEffect } from "react";
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

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: gameId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Rediriger si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const playerId = user?.id ?? "";

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/")}
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
          <GameContent gameId={gameId} playerId={playerId} router={router} />
          {/* ── Chat mobile ── */}
          <MobileChatButton
            gameId={gameId}
            onClick={() => setShowMobileChat(true)}
          />
          <MobileChatOverlay
            gameId={gameId}
            open={showMobileChat}
            onClose={() => setShowMobileChat(false)}
          />
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
}: {
  gameId: string;
  playerId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { gameState, isLoading, error, actions } = useGame({
    gameId,
    playerId,
  });

  // ── Loading ──
  if (isLoading || !gameState) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Chargement de la partie...
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
    toast.info("Vous avez abandonné la partie.");
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
            Phase inconnue : {gameState.phase}
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
                  Abandonner
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Abandonner la partie ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Vous serez éliminé et votre adversaire gagnera la partie.
                    {gameState.gameMode === "RANKED" &&
                      " Votre ELO sera impacté."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSurrender}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmer l&apos;abandon
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

// ─── Chat mobile (flottant en bas) ───
function MobileChatButton({
  gameId,
  onClick,
}: {
  gameId: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 shadow-lg transition-all hover:scale-105 lg:hidden"
    >
      <MessageSquare className="size-5 text-primary-foreground" />
      <span className="font-medium text-primary-foreground">Chat</span>
    </button>
  );
}

function MobileChatOverlay({
  gameId,
  open,
  onClose,
}: {
  gameId: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[70vh]">
        <GameChat gameId={gameId} />
      </div>
    </div>
  );
}
