"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Target,
  Flame,
  Dice5,
  Pencil,
  Check,
  X,
  Crown,
  Swords,
  Camera,
  Star,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { EloChart } from "@/features/profile/components/elo-chart";
import { profileClient } from "@/features/profile/api/profile-client";
import { useBilling } from "@/features/billing/hooks/use-billing";

// =============================================================================
// Helpers
// =============================================================================

function getSubscriptionLabel(tier: string) {
  switch (tier) {
    case "premium":
      return { label: "Premium", variant: "default" as const };
    case "vip":
      return { label: "VIP", variant: "destructive" as const };
    default:
      return { label: "Free", variant: "secondary" as const };
  }
}

function getWinRate(gamesPlayed: number, gamesWon: number) {
  if (gamesPlayed === 0) return "0%";
  return `${Math.round((gamesWon / gamesPlayed) * 100)}%`;
}

function getChallengeSuccessRate(total: number, success: number) {
  if (total === 0) return "0%";
  return `${Math.round((success / total) * 100)}%`;
}

// =============================================================================
// Page
// =============================================================================

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const { profile, isLoading: profileLoading, actions } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: billingLoading, openPortal } = useBilling();

  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [editPseudo, setEditPseudo] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirection si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Toast de bienvenue après upgrade
  useEffect(() => {
    if (searchParams.get("upgraded") === "1") {
      toast.success("Welcome to Premium! Your account has been upgraded.");
      // Nettoyer le query param sans rechargement
      router.replace("/profile");
      refreshProfile();
    }
  }, [searchParams, router, refreshProfile]);

  if (authLoading || profileLoading || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Profile not found.
      </div>
    );
  }

  const sub = getSubscriptionLabel(profile.subscription);

  // ─── Save pseudo ───
  async function handleSavePseudo() {
    if (!editPseudo.trim()) return;

    setIsSaving(true);
    const result = await actions.updatePseudo(editPseudo.trim());

    if (result.success) {
      toast.success("Pseudo updated!");
      setIsEditingPseudo(false);
      await refreshProfile();
    } else {
      // Use the specific error message from the API
      toast.error(result.error ?? "Unable to update pseudo.");
    }
    setIsSaving(false);
  }

  // ─── Start editing ───
  function startEditing() {
    setEditPseudo(profile!.pseudo);
    setIsEditingPseudo(true);
  }

  // ─── Handle avatar upload ───
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPremiumUser = profile?.subscription !== "free";
    const allowedTypes = isPremiumUser
      ? ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
      : ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      if (file.type === "image/gif") {
        toast.error("GIF avatars are reserved for Premium members.");
      } else {
        toast.error("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
      }
      return;
    }

    const isGif = file.type === "image/gif";
    const maxSize = isGif ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(isGif ? "File size exceeds 10MB limit." : "File size exceeds 5MB limit.");
      return;
    }

    setIsUploadingAvatar(true);
    const result = await profileClient.uploadAvatar(file);

    if (result.success && result.data) {
      toast.success("Avatar updated!");
      // Refresh profile to get the new avatar URL
      await actions.refresh();
    } else {
      toast.error(result.error ?? "Unable to upload avatar.");
    }

    setIsUploadingAvatar(false);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ─── Header ─── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Dice5 className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">My Profile</span>
        </div>
      </header>

      {/* ─── Contenu ─── */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* ── Carte identité ── */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="size-20">
                <AvatarImage 
                  src={profile.avatarUrl ?? undefined} 
                  alt={profile.pseudo}
                  className="object-cover"
                />
                <AvatarFallback className="text-xl">
                  {profile.pseudo.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept={
                  profile?.subscription !== "free"
                    ? "image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    : "image/jpeg,image/jpg,image/png,image/webp"
                }
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploadingAvatar}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                title="Change avatar"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="size-6 animate-spin text-white" />
                ) : (
                  <Camera className="size-6 text-white" />
                )}
              </button>
            </div>

            {/* Infos */}
            <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
              {/* Pseudo (éditable) */}
              {isEditingPseudo ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editPseudo}
                    onChange={(e) => setEditPseudo(e.target.value)}
                    maxLength={20}
                    className="h-9 w-48 text-lg font-bold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSavePseudo();
                      if (e.key === "Escape") setIsEditingPseudo(false);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSavePseudo}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4 text-green-500" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingPseudo(false)}
                  >
                    <X className="size-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{profile.pseudo}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startEditing}
                  >
                    <Pencil className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={sub.variant}>{sub.label}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Trophy className="size-3" />
                  1v1: {profile.elo1v1}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Trophy className="size-3" />
                  4p: {profile.elo4p}
                </Badge>
              </div>

              {/* Member since */}
              <p className="text-xs text-muted-foreground">
                Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Level & XP ── */}
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <span className="text-2xl font-extrabold text-primary">
                {profile.levelData.level}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Zap className="size-3.5 text-yellow-500" />
                  Level {profile.levelData.level}
                </span>
                <span className="text-xs text-muted-foreground">
                  {profile.levelData.currentLevelXp} / {profile.levelData.xpToNextLevel} XP
                </span>
              </div>
              <Progress value={profile.levelData.progress * 100} className="h-2.5" />
              <p className="text-xs text-muted-foreground">
                {profile.levelData.totalXp} XP total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Statistiques ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Games */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="size-4 text-primary" />
                Games
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  label="Played"
                  value={profile.gamesPlayed.toString()}
                />
                <StatItem
                  label="Won"
                  value={profile.gamesWon.toString()}
                />
                <StatItem
                  label="Win Rate"
                  value={getWinRate(profile.gamesPlayed, profile.gamesWon)}
                />
                <StatItem
                  label="Current streak"
                  value={profile.currentWinStreak.toString()}
                />
              </div>
            </CardContent>
          </Card>

          {/* Challenge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-primary" />
                Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  label="Calls"
                  value={profile.totalChallengeCalls.toString()}
                />
                <StatItem
                  label="Successful"
                  value={profile.totalChallengeSuccess.toString()}
                />
                <StatItem
                  label="Accuracy"
                  value={getChallengeSuccessRate(
                    profile.totalChallengeCalls,
                    profile.totalChallengeSuccess,
                  )}
                />
                <StatItem
                  label="Best streak"
                  value={profile.bestWinStreak.toString()}
                  icon={<Flame className="size-3 text-orange-500" />}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Abonnement ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-4 text-yellow-400 fill-yellow-400" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile.subscription === "free" ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Free plan</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Premium to unlock GIF avatars, full ELO history and more.
                  </p>
                </div>
                <Button onClick={() => router.push("/pricing")}>
                  <Star className="mr-2 size-4" />
                  Upgrade
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    Premium
                  </p>
                  {profile.subscriptionExpiresAt && (
                    <p className="text-sm text-muted-foreground">
                      Renews on{" "}
                      {new Date(profile.subscriptionExpiresAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={openPortal}
                  disabled={billingLoading}
                >
                  {billingLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 size-4" />
                  )}
                  Manage subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── ELO Evolution (chart) ── */}
        <EloChart elo1v1={profile.elo1v1} elo4p={profile.elo4p} />

        {/* ── ELO Ranking ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="size-4 text-yellow-500" />
              Ranking
            </CardTitle>
            <CardDescription>
              Your position in the ELO ranking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-3xl font-bold">{profile.elo1v1}</p>
                  <p className="text-sm text-muted-foreground">ELO 1v1</p>
                </div>
                <Separator orientation="vertical" className="h-auto" />
                <div>
                  <p className="text-3xl font-bold">{profile.elo4p}</p>
                  <p className="text-sm text-muted-foreground">ELO 4 players</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/leaderboard")}
              >
                View leaderboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// =============================================================================
// Internal components
// =============================================================================

function StatItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="flex items-center gap-1 text-lg font-semibold">
        {icon}
        {value}
      </p>
    </div>
  );
}
