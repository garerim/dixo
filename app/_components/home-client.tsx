"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
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
  BookOpen,
  Paintbrush,
  ShoppingBag,
  Bot,
  GraduationCap,
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
import { MainHeader } from "@/components/main-header";
import { LegalFooter } from "@/components/legal-footer";
import { AdSidebarLayout } from "@/components/ad-banner";
import { LanguageSelector } from "@/components/language-selector";
import { LanguageButton } from "@/components/language-button";
import { ThemeToggleButton } from "@/components/theme-toggle";
import { gameClient } from "@/features/game/api/game-client";
import { useMatchmaking } from "@/features/matchmaking/hooks/use-matchmaking";
import { NotificationBell } from "@/features/notifications";
import Link from "next/link";

export function HomeClient() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");

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
      toast.success(t("gameCreated"));
    } else {
      toast.error(result.error ?? t("unableToCreate"));
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
    toast.info(t("searchCancelled"));
  }

  // ─── Join a game ───
  async function handleJoin() {
    if (joinCode.length !== 6) {
      toast.error(t("codeMustBe6"));
      return;
    }

    setIsJoining(true);
    const result = await gameClient.joinGame({
      joinCode: joinCode.toUpperCase(),
      displayName,
    });

    if (result.success && result.data) {
      toast.success(t("joinedGame"));
      router.push(`/game/${result.data.gameId}`);
    } else {
      toast.error(result.error ?? t("unableToJoin"));
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
      toast.success(t("codeCopied"));
    }
  }

  // ─── Searching for a game ───
  const isSearching = mmState === "searching";

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <MainHeader />

      {/* ─── Contenu ─── */}
      <AdSidebarLayout slotLeft="ADSENSE_HOME_LEFT" slotRight="ADSENSE_HOME_RIGHT">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
        {/* Titre */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-20 items-center justify-center">
            <Image src="/logo.png" alt="Dixo" width={80} height={80} className="size-20 drop-shadow-xl" />
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-md text-muted-foreground">
            {t("subtitle")}
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
                  {t("normalGame")}
                </CardTitle>
                <CardDescription>
                  {t("normalGameDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePlayNormal(2)}
                >
                  <Swords className="size-4" />
                  {t("1v1")}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePlayNormal(4)}
                >
                  <Users className="size-4" />
                  {t("4players")}
                </Button>
              </CardContent>
            </Card>

            {/* ── Ranked Game ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-5 text-yellow-500" />
                  {t("rankedGame")}
                </CardTitle>
                <CardDescription>
                  {t("rankedGameDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handlePlayRanked(2)}
                >
                  <Swords className="size-4" />
                  {t("1v1")}
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
                  {t("4players")}
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
                {t("playWithFriends")}
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
                {t("createGame")}
              </Button>

              {/* Rejoindre */}
              <div className="flex gap-2">
                <Input
                  placeholder={t("codePlaceholder")}
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

            {/* ── Training vs Bots ── */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {t("training")}
              </span>
              <Separator className="flex-1" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => router.push("/training")}
              >
                <Bot className="size-4" />
                {t("trainVsBots")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => router.push("/tutorial/play")}
              >
                <GraduationCap className="size-4" />
                {t("tutorial")}
              </Button>
            </div>
          </div>
        )}
      </main>
      </AdSidebarLayout>

      {/* ─── Game code dialog ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("gameCreated")}</DialogTitle>
            <DialogDescription>
              {t("shareCode")}
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
              {t("goToLobby")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LegalFooter />
    </div>
  );
}

// =============================================================================
// Composant : Landing Page (non connecté)
// =============================================================================

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

function LandingPage() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const t = useTranslations("home");
  const tc = useTranslations("common");

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30 overflow-x-hidden">
      {/* ─── Header ─── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between border-b px-4 py-3 sm:px-8"
      >
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Dixo" width={28} height={28} className="size-7" />
          <span className="text-lg font-bold tracking-tight">{t("title")}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/how-to-play">{tc("howToPlay")}</Link>
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/pricing">{tc("pricing")}</Link>
          </Button>
          <ThemeToggleButton />
          <LanguageButton />
          <Button size="sm" className="shrink-0" onClick={signInWithGoogle}>
            {tc("signIn")}
          </Button>
        </div>
      </motion.header>

      {/* ─── Hero ─── */}
      <section className="flex flex-col items-center gap-6 px-4 py-20 text-center sm:py-28">
        {/* Dice animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative flex size-24 items-center justify-center"
        >
          <Image src="/logo.png" alt="Dixo" width={96} height={96} className="size-24 drop-shadow-2xl" />
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.6 }}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900"
          >
            ✦
          </motion.span>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="flex flex-col items-center gap-3"
        >
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-5xl font-extrabold tracking-tight sm:text-6xl"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-xl font-medium text-muted-foreground sm:text-2xl"
          >
            {t("heroTitle")}
          </motion.p>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="max-w-md text-muted-foreground"
          >
            {t("heroDescription")}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" className="gap-2 px-8" onClick={signInWithGoogle}>
            <svg className="size-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t("playFree")}
          </Button>
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <Link href="/how-to-play">
              {tc("howToPlay")}
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-xs text-muted-foreground"
        >
          {t("freeNote")}
        </motion.p>
      </section>

      {/* ─── Game modes ─── */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center text-2xl font-bold"
        >
          {t("gameModes")}
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid gap-4 sm:grid-cols-3"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Swords className="size-5 text-blue-500" />
                  {t("normalModeTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("normalModeDesc")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <Card className="h-full border-yellow-500/40 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-5 text-yellow-500" />
                  {t("rankedModeTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("rankedModeDesc")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-5 text-purple-500" />
                  {t("privateModeTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("privateModeDesc")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── How to play ─── */}
      <section
        id="how-to-play"
        className="mx-auto w-full max-w-3xl px-4 py-12"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center text-2xl font-bold"
        >
          {t("howToPlaySection")}
        </motion.h2>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="flex flex-col gap-6"
        >
          {[
            {
              step: "1",
              title: t("step1Title"),
              desc: t("step1Desc"),
              icon: <Image src="/logo.png" alt="" width={24} height={24} className="size-6" />,
            },
            {
              step: "2",
              title: t("step2Title"),
              desc: t("step2Desc"),
              icon: <Swords className="size-6 text-blue-500" />,
            },
            {
              step: "3",
              title: t("step3Title"),
              desc: t("step3Desc"),
              icon: <Zap className="size-6 text-yellow-500" />,
            },
            {
              step: "4",
              title: t("step4Title"),
              desc: t("step4Desc"),
              icon: <Trophy className="size-6 text-green-500" />,
            },
          ].map(({ step, title, desc, icon }) => (
            <motion.div
              key={step}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className="flex gap-4"
            >
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
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── Premium teaser ─── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-2xl px-4 py-12"
      >
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:text-left">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Star className="size-8 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{t("premiumBanner")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("premiumBannerDesc")}
              </p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link href="/pricing">{t("seePlans")}</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      {/* ─── Final CTA ─── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4 px-4 py-16 text-center"
      >
        <h2 className="text-3xl font-bold">{t("readyToBluff")}</h2>
        <p className="text-muted-foreground">{t("readyToBluffDesc")}</p>
        <Button size="lg" className="gap-2 px-10" onClick={signInWithGoogle}>
          <svg className="size-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t("getStarted")}
        </Button>
      </motion.section>

      <LegalFooter />
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
  const ts = useTranslations("search");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const isRanked = gameMode === "RANKED";
  const modeLabel = isRanked ? th("rankedGame") : th("normalGame");
  const formatLabel = playerCount === 2 ? th("1v1") : th("4players");

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
            {playerCount === 2 ? ts("searchingOpponent") : ts("searchingOpponents")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {modeLabel} — {formatLabel}
          </p>
        </div>

        {/* Info */}
        <div className="flex w-full justify-around rounded-lg bg-muted/50 px-4 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold tabular-nums">{waitTime}</p>
            <p className="text-xs text-muted-foreground">{ts("waitTime")}</p>
          </div>
          <Separator orientation="vertical" className="h-auto" />
          <div className="text-center">
            <p className="text-2xl font-bold">{playersInQueue}</p>
            <p className="text-xs text-muted-foreground">{ts("inQueue")}</p>
          </div>
          {isRanked && (
            <>
              <Separator orientation="vertical" className="h-auto" />
              <div className="text-center">
                <p className="text-2xl font-bold">{elo}</p>
                <p className="text-xs text-muted-foreground">{ts("elo")}</p>
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
          {tc("cancel")}
        </Button>
      </CardContent>
    </Card>
  );
}
