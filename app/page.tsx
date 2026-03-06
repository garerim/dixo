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
  User,
  Star,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    profile?.pseudo ?? user?.user_metadata?.full_name ?? "Player";

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

  // ─── Create a private game (with invitation code) ───
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
      toast.success("Game created!");
    } else {
      toast.error(result.error ?? "Unable to create the game.");
    }
    setIsCreating(false);
  }

  // ─── Start Normal matchmaking ───
  async function handlePlayNormal(playerCount: 2 | 4) {
    await mmActions.search("NORMAL", playerCount);
  }

  // ─── Start Ranked matchmaking ───
  async function handlePlayRanked(playerCount: 2 | 4) {
    await mmActions.search("RANKED", playerCount);
  }

  // ─── Cancel search ───
  async function handleCancelSearch() {
    await mmActions.cancel();
    toast.info("Search cancelled.");
  }

  // ─── Join a game ───
  async function handleJoin() {
    if (joinCode.length !== 6) {
      toast.error("The code must contain 6 characters.");
      return;
    }

    setIsJoining(true);
    const result = await gameClient.joinGame({
      joinCode: joinCode.toUpperCase(),
      displayName,
    });

    if (result.success && result.data) {
      toast.success("You have joined the game!");
      router.push(`/game/${result.data.gameId}`);
    } else {
      toast.error(result.error ?? "Unable to join the game.");
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
      toast.success("Code copied!");
    }
  }

  // ─── Searching for a game ───
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

          {/* Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted">
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="mr-2 size-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/friends")}>
                <UserPlus className="mr-2 size-4" />
                <span>Friends</span>
              </DropdownMenuItem>
              {profile?.subscription === "free" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/pricing")}>
                    <Star className="mr-2 size-4 fill-yellow-400 text-yellow-400" />
                    <span>Upgrade to Premium</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 size-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            Bluff your opponents in this online dice bluffing game inspired by
            Perudo.
          </p>
        </div>

        {/* ─── Search screen ─── */}
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
          /* ─── Game mode selection ─── */
          <div className="flex w-full max-w-md flex-col gap-4">
            {/* Matchmaking error */}
            {mmError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
                {mmError}
              </div>
            )}

            {/* ── Normal Game ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Swords className="size-5 text-blue-500" />
                  Normal Game
                </CardTitle>
                <CardDescription>
                  Quick matchmaking, no impact on your ELO
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
                  4 players
                </Button>
              </CardContent>
            </Card>

            {/* ── Ranked Game ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-5 text-yellow-500" />
                  Ranked Game
                </CardTitle>
                <CardDescription>
                  Face players of your level, earn ELO
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
                  4 players
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
                or play with friends
              </span>
              <Separator className="flex-1" />
            </div>

            {/* ── Private Game ── */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Create */}
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
                Create a game
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

      {/* ─── Game code dialog ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game created!</DialogTitle>
            <DialogDescription>
              Share this code with your friends so they can join the game.
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
              Go to lobby
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Footer ─── */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Dixo — Online dice bluffing game 🎲
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
  const modeLabel = isRanked ? "Ranked" : "Normal";
  const formatLabel = playerCount === 2 ? "1v1" : "4 players";

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="flex flex-col items-center gap-4 pt-6">
        {/* Search animation */}
        <div className="relative flex size-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary/10" />
          <Search className="relative size-8 text-primary" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Searching for {playerCount === 2 ? "opponent" : "opponents"}...
          </h3>
          <p className="text-sm text-muted-foreground">
            {modeLabel} — {formatLabel}
          </p>
        </div>

        {/* Info */}
        <div className="flex w-full justify-around rounded-lg bg-muted/50 px-4 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{waitTime}</p>
            <p className="text-xs text-muted-foreground">Wait time</p>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div className="text-center">
            <p className="text-2xl font-bold">{playersInQueue}</p>
            <p className="text-xs text-muted-foreground">In queue</p>
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
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
}
