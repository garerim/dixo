"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { EloChart } from "@/features/profile/components/elo-chart";

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
      return { label: "Gratuit", variant: "secondary" as const };
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
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const { profile, isLoading: profileLoading, actions } = useProfile();
  const router = useRouter();

  const [isEditingPseudo, setIsEditingPseudo] = useState(false);
  const [editPseudo, setEditPseudo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Redirection si pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

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
        Profil non trouvé.
      </div>
    );
  }

  const sub = getSubscriptionLabel(profile.subscription);

  // ─── Sauvegarder le pseudo ───
  async function handleSavePseudo() {
    if (!editPseudo.trim()) return;

    setIsSaving(true);
    const success = await actions.updatePseudo(editPseudo.trim());

    if (success) {
      toast.success("Pseudo mis à jour !");
      setIsEditingPseudo(false);
      await refreshProfile();
    } else {
      toast.error("Impossible de mettre à jour le pseudo.");
    }
    setIsSaving(false);
  }

  // ─── Commencer l'édition ───
  function startEditing() {
    setEditPseudo(profile!.pseudo);
    setIsEditingPseudo(true);
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
          <span className="text-lg font-bold tracking-tight">Mon Profil</span>
        </div>
      </header>

      {/* ─── Contenu ─── */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-6">
        {/* ── Carte identité ── */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <Avatar className="size-20">
              <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.pseudo} />
              <AvatarFallback className="text-xl">
                {profile.pseudo.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

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

              {/* Membre depuis */}
              <p className="text-xs text-muted-foreground">
                Membre depuis le{" "}
                {new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Statistiques ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Parties */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="size-4 text-primary" />
                Parties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <StatItem
                  label="Jouées"
                  value={profile.gamesPlayed.toString()}
                />
                <StatItem
                  label="Gagnées"
                  value={profile.gamesWon.toString()}
                />
                <StatItem
                  label="Win Rate"
                  value={getWinRate(profile.gamesPlayed, profile.gamesWon)}
                />
                <StatItem
                  label="Série en cours"
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
                  label="Appels"
                  value={profile.totalChallengeCalls.toString()}
                />
                <StatItem
                  label="Réussis"
                  value={profile.totalChallengeSuccess.toString()}
                />
                <StatItem
                  label="Précision"
                  value={getChallengeSuccessRate(
                    profile.totalChallengeCalls,
                    profile.totalChallengeSuccess,
                  )}
                />
                <StatItem
                  label="Meilleure série"
                  value={profile.bestWinStreak.toString()}
                  icon={<Flame className="size-3 text-orange-500" />}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Évolution ELO (graphique) ── */}
        <EloChart elo1v1={profile.elo1v1} elo4p={profile.elo4p} />

        {/* ── Classement ELO ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="size-4 text-yellow-500" />
              Classement
            </CardTitle>
            <CardDescription>
              Votre position dans le classement ELO
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
                  <p className="text-sm text-muted-foreground">ELO 4 joueurs</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/leaderboard")}
              >
                Voir le classement
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// =============================================================================
// Composants internes
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
