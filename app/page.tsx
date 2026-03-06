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
  Shield,
  Zap,
  ChevronRight,
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
import Link from "next/link";

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

  if (authLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Non connecté → Landing page
  if (!user) {
    return <LandingPage />;
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
            Bluff your opponents in this online dice bluffing game.
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
// Composant : Landing Page (non connecté)
// =============================================================================

function LandingPage() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2">
          <Dice5 className="size-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">Dixo</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">Pricing</Link>
          </Button>
          <Button size="sm" onClick={signInWithGoogle}>
            Sign in
          </Button>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="flex flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
        {/* Dice animation */}
        <div className="relative flex size-24 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
          <Dice5 className="size-14" />
          <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900">
            ✦
          </span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Dixo
          </h1>
          <p className="text-xl font-medium text-muted-foreground sm:text-2xl">
            The online dice bluffing game
          </p>
          <p className="max-w-md text-muted-foreground">
            Bluff your opponents, call their bluffs, and be
            the last player standing. Free to play, online, with friends or
            strangers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" className="gap-2 px-8" onClick={signInWithGoogle}>
            <svg className="size-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Play for free
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => {
              document.getElementById("how-to-play")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            How to play
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Social proof */}
        <p className="text-xs text-muted-foreground">
          Free to play · No download · Sign in with Google
        </p>
      </section>

      {/* ─── Game modes ─── */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold">Pick your game mode</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="size-5 text-blue-500" />
                Normal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Quick matchmaking against players of all levels. No ELO impact — just for fun.
              </p>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-5 text-yellow-500" />
                Ranked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                ELO-based matchmaking. Win to climb the leaderboard, lose ELO if you bluff too hard.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-5 text-purple-500" />
                Private
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create a private game and invite friends with a 6-character code. Up to 6 players.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── How to play ─── */}
      <section
        id="how-to-play"
        className="mx-auto w-full max-w-3xl px-4 py-12"
      >
        <h2 className="mb-8 text-center text-2xl font-bold">How to play</h2>
        <div className="flex flex-col gap-6">
          {[
            {
              step: "1",
              title: "Roll your dice",
              desc: "Each player rolls their dice in secret at the start of every round. Only you can see your own dice.",
              icon: <Dice5 className="size-6 text-primary" />,
            },
            {
              step: "2",
              title: "Place a bid",
              desc: 'Bid on how many dice of a given face exist across ALL players\' dice combined. Example: "3 fours". Each bid must be higher than the previous.',
              icon: <Swords className="size-6 text-blue-500" />,
            },
            {
              step: "3",
              title: "Call the bluff",
              desc: 'Say "Challenge!" if you think the bid is impossible. All dice are revealed — if the bid was wrong, the bidder loses a die. Otherwise, you do.',
              icon: <Zap className="size-6 text-yellow-500" />,
            },
            {
              step: "4",
              title: "Last one standing wins",
              desc: "Players eliminated when they run out of dice. The last player with dice wins the game and gains ELO in Ranked mode.",
              icon: <Trophy className="size-6 text-green-500" />,
            },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold">
                {step}
              </div>
              <div className="flex flex-1 flex-col gap-1 pt-1">
                <div className="flex items-center gap-2">
                  {icon}
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Premium teaser ─── */}
      <section className="mx-auto w-full max-w-2xl px-4 py-12">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:text-left">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Star className="size-8 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Dixo Premium — €4.99/month</h3>
              <p className="text-sm text-muted-foreground">
                GIF avatars, Premium badge in-game, full ELO history, and more to come.
              </p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link href="/pricing">See plans</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <h2 className="text-3xl font-bold">Ready to bluff?</h2>
        <p className="text-muted-foreground">Join in seconds with your Google account.</p>
        <Button size="lg" className="gap-2 px-10" onClick={signInWithGoogle}>
          <svg className="size-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Get started — it's free
        </Button>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>© 2025 Dixo</span>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </div>
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
