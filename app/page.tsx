"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dice5,
  Plus,
  LogIn,
  LogOut,
  Copy,
  Loader2,
  Swords,
  Trophy,
  Users,
  Search,
  X,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { gameClient } from "@/features/game/api/game-client";
import { useMatchmaking } from "@/features/matchmaking/hooks/use-matchmaking";

export default function HomePage() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const displayName =
    profile?.pseudo ?? user?.user_metadata?.full_name ?? "Joueur";

  const {
    state: mmState,
    queueStatus,
    waitTime,
    error: mmError,
    actions: mmActions,
  } = useMatchmaking(displayName);

  // Rediriger vers login si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const avatarUrl =
    profile?.avatarUrl ?? user?.user_metadata?.avatar_url ?? undefined;

  // ─── Créer une partie privée (avec code d'invitation) ───
  async function handleCreatePrivate() {
    setIsCreating(true);
    const result = await gameClient.createGame({
      displayName,
      gameMode: "PRIVATE" as never,
    });

    if (result.success && result.data) {
      setCreatedCode(result.data.joinCode);
      setCreatedGameId(result.data.gameId);
      setShowCreateDialog(true);
      toast.success("Partie créée !");
    } else {
      toast.error(result.error ?? "Impossible de créer la partie.");
    }
    setIsCreating(false);
  }

  // ─── Lancer matchmaking Normal ───
  async function handlePlayNormal(playerCount: 2 | 4) {
    await mmActions.search("NORMAL", playerCount);
  }

  // ─── Lancer matchmaking Classée ───
  async function handlePlayRanked(playerCount: 2 | 4) {
    await mmActions.search("RANKED", playerCount);
  }

  // ─── Annuler la recherche ───
  async function handleCancelSearch() {
    await mmActions.cancel();
    toast.info("Recherche annulée.");
  }

  // ─── Rejoindre une partie ───
  async function handleJoin() {
    if (joinCode.length !== 6) {
      toast.error("Le code doit contenir 6 caractères.");
      return;
    }

    setIsJoining(true);
    const result = await gameClient.joinGame({
      joinCode: joinCode.toUpperCase(),
      displayName,
    });

    if (result.success && result.data) {
      toast.success("Vous avez rejoint la partie !");
      router.push(`/game/${result.data.gameId}`);
    } else {
      toast.error(result.error ?? "Impossible de rejoindre la partie.");
    }
    setIsJoining(false);
  }

  function goToGame() {
    if (createdGameId) {
      router.push(`/game/${createdGameId}`);
    }
  }

  function copyCode() {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      toast.success("Code copié !");
    }
  }

  // ─── En recherche de partie ───
  const isSearching = mmState === "searching";

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Dice5 className="size-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">Dixo</span>
        </div>

        <div className="flex items-center gap-3">
          {/* ELO Badges */}
          {profile && (
            <div className="hidden gap-1.5 sm:flex">
              <Badge variant="outline" className="gap-1">
                <Trophy className="size-3" />
                1v1: {profile.elo1v1}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="size-3" />
                4p: {profile.elo4p}
              </Badge>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/friends")}
            className="hidden sm:flex"
            title="Amis"
          >
            <UserPlus className="size-5" />
          </Button>
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted"
            onClick={() => router.push("/profile")}
          >
            <Avatar className="size-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
              {displayName}
            </span>
          </button>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* ─── Contenu ─── */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
        {/* Titre */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl">
            <Dice5 className="size-11" />
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Dixo
          </h1>
          <p className="max-w-md text-muted-foreground">
            Bluffez vos adversaires dans ce jeu de dés menteur inspiré du
            Perudo.
          </p>
        </div>

        {/* ─── Écran de recherche ─── */}
        {isSearching ? (
          <SearchingView
            waitTime={waitTime}
            playersInQueue={queueStatus?.playersInQueue ?? 0}
            gameMode={queueStatus?.gameMode ?? "NORMAL"}
            playerCount={queueStatus?.playerCount ?? 2}
            elo={queueStatus?.elo ?? profile?.elo1v1 ?? 1000}
            onCancel={handleCancelSearch}
          />
        ) : (
          /* ─── Sélection du mode de jeu ─── */
          <div className="flex w-full max-w-md flex-col gap-4">
            {/* Erreur matchmaking */}
            {mmError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                {mmError}
              </div>
            )}

            {/* ── Partie Normale ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Swords className="size-5 text-blue-500" />
                  Partie Normale
                </CardTitle>
                <CardDescription>
                  Matchmaking rapide, sans impact sur votre ELO
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePlayNormal(2)}
                >
                  <Swords className="size-4" />
                  1 vs 1
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePlayNormal(4)}
                >
                  <Users className="size-4" />
                  4 joueurs
                </Button>
              </CardContent>
            </Card>

            {/* ── Partie Classée ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-5 text-yellow-500" />
                  Partie Classée
                </CardTitle>
                <CardDescription>
                  Affrontez des joueurs de votre niveau, gagnez de l&apos;ELO
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePlayRanked(2)}
                >
                  <Swords className="size-4" />
                  1 vs 1
                  {profile && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {profile.elo1v1}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePlayRanked(4)}
                >
                  <Users className="size-4" />
                  4 joueurs
                  {profile && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {profile.elo4p}
                    </Badge>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">
                ou jouez avec des amis
              </span>
              <Separator className="flex-1" />
            </div>

            {/* ── Partie Privée ── */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Créer */}
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={handleCreatePrivate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Créer une partie
              </Button>

              {/* Rejoindre */}
              <div className="flex gap-2">
                <Input
                  placeholder="CODE"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 text-center font-mono tracking-[0.15em] uppercase"
                />
                <Button
                  variant="secondary"
                  className="gap-1"
                  onClick={handleJoin}
                  disabled={isJoining || joinCode.length !== 6}
                >
                  {isJoining ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogIn className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Dialog code de partie ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partie créée !</DialogTitle>
            <DialogDescription>
              Partagez ce code avec vos amis pour qu&apos;ils rejoignent la
              partie.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 py-4">
            <div className="rounded-lg bg-muted px-6 py-4 text-center">
              <p className="font-mono text-3xl font-bold tracking-[0.3em]">
                {createdCode}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={copyCode}>
              <Copy className="size-4" />
            </Button>
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={goToGame}>
              Accéder au lobby
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Footer ─── */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Dixo — Jeu de dés menteur en ligne 🎲
      </footer>
    </div>
  );
}

// =============================================================================
// Composant : Recherche en cours
// =============================================================================

function SearchingView({
  waitTime,
  playersInQueue,
  gameMode,
  playerCount,
  elo,
  onCancel,
}: {
  waitTime: string;
  playersInQueue: number;
  gameMode: "NORMAL" | "RANKED";
  playerCount: 2 | 4;
  elo: number;
  onCancel: () => void;
}) {
  const isRanked = gameMode === "RANKED";
  const modeLabel = isRanked ? "Classée" : "Normale";
  const formatLabel = playerCount === 2 ? "1v1" : "4 joueurs";

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        {/* Animation de recherche */}
        <div className="relative flex size-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary/10" />
          <Search className="relative size-8 text-primary" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Recherche {playerCount === 2 ? "d'adversaire" : "d'adversaires"}...
          </h3>
          <p className="text-sm text-muted-foreground">
            {modeLabel} — {formatLabel}
          </p>
        </div>

        {/* Infos */}
        <div className="flex w-full justify-around rounded-lg bg-muted/50 px-4 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{waitTime}</p>
            <p className="text-xs text-muted-foreground">Attente</p>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div className="text-center">
            <p className="text-2xl font-bold">{playersInQueue}</p>
            <p className="text-xs text-muted-foreground">En file</p>
          </div>
          {isRanked && (
            <>
              <Separator orientation="vertical" className="h-auto" />
              <div className="text-center">
                <p className="text-2xl font-bold">{elo}</p>
                <p className="text-xs text-muted-foreground">ELO</p>
              </div>
            </>
          )}
        </div>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={onCancel}
        >
          <X className="size-4" />
          Annuler
        </Button>
      </CardContent>
    </Card>
  );
}
