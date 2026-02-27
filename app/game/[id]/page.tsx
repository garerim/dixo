"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dice5, ArrowLeft, Loader2, Flag } from "lucide-react";
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
import { useAuth } from "@/components/providers/auth-provider";
import { useGame } from "@/features/game/hooks/use-game";
import { LobbyView } from "@/features/game/components/lobby-view";
import { BiddingView } from "@/features/game/components/bidding-view";
import { ResultView } from "@/features/game/components/result-view";
import { GameOverView } from "@/features/game/components/game-over-view";

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
        <GameContent gameId={gameId} playerId={playerId} router={router} />
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
    <>
      {/* ── Bouton Abandonner (flottant en bas) ── */}
      {canSurrender && (
        <div className="flex justify-end px-4 pt-2">
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
    </>
  );
}
