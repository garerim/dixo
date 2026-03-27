"use client";

// =============================================================================
// PAGE — /leaderboard — Classement ELO
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Trophy,
  Crown,
  Medal,
  Users,
  Swords,
  Loader2,
  TrendingUp,
  Shield,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { profileClient } from "@/features/profile/api/profile-client";
import type { PublicProfile } from "@/types/api";
import { getRankForElo } from "@/core/ranks";

// =============================================================================
// Helpers
// =============================================================================

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="size-4 text-yellow-400" />;
  if (rank === 2) return <Medal className="size-4 text-slate-400" />;
  if (rank === 3) return <Medal className="size-4 text-amber-600" />;
  return <span className="text-sm text-muted-foreground font-medium w-4 text-center">{rank}</span>;
}

function rankIconForElo(elo: number) {
  const rank = getRankForElo(elo);
  const className = `size-3.5 ${rank.color}`;
  switch (rank.icon) {
    case "shield":
      return <Shield className={className} />;
    case "medal":
      return <Medal className={className} />;
    case "gem":
      return <Gem className={className} />;
    case "crown":
      return <Crown className={className} />;
    default:
      return <Shield className={className} />;
  }
}

function winRate(profile: PublicProfile): string {
  if (!profile.gamesPlayed) return "—";
  return `${Math.round((profile.gamesWon / profile.gamesPlayed) * 100)}%`;
}

// =============================================================================
// Row
// =============================================================================

function LeaderboardRow({
  profile,
  rank,
  mode,
  isMe,
  t,
}: {
  profile: PublicProfile;
  rank: number;
  mode: "1v1" | "4p";
  isMe: boolean;
  t: ReturnType<typeof useTranslations<"leaderboard">>;
}) {
  const elo = mode === "1v1" ? profile.elo1v1 : profile.elo4p;
  const topThree = rank <= 3;

  return (
    <Link
      href={`/profile?id=${profile.id}`}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted/60 ${
        topThree ? "border bg-card" : ""
      } ${isMe ? "ring-2 ring-primary" : ""}`}
    >
      {/* Rank */}
      <div className="flex w-6 shrink-0 items-center justify-center">
        {rankIcon(rank)}
      </div>

      {/* Avatar */}
      <div className="relative size-9 shrink-0">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt={profile.pseudo}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-bold">
            {profile.pseudo[0]?.toUpperCase()}
          </div>
        )}
        {profile.isOnline && (
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-green-500 ring-2 ring-background" />
        )}
      </div>

      {/* Name + badges */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5 truncate">
          <span className={`truncate font-medium ${isMe ? "text-primary" : ""}`}>
            {profile.pseudo}
          </span>
          {isMe && (
            <Badge variant="outline" className="shrink-0 text-xs px-1.5 py-0">
              {t("you")}
            </Badge>
          )}
          {profile.subscription === "premium" && (
            <Badge
              variant="secondary"
              className="shrink-0 gap-1 text-xs px-1.5 py-0 text-yellow-500"
            >
              <Crown className="size-2.5" />
              {t("premium")}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {t("playerInfo", { level: profile.levelData.level, games: profile.gamesPlayed, winRate: winRate(profile) })}
        </span>
      </div>

      {/* ELO + Rank icon */}
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className={`text-lg font-bold tabular-nums ${topThree ? "text-foreground" : ""}`}>
          {elo}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {rankIconForElo(elo)}
          {getRankForElo(elo).label}
        </span>
      </div>
    </Link>
  );
}

// =============================================================================
// Page
// =============================================================================

export default function LeaderboardPage() {
  const t = useTranslations("leaderboard");
  const tc = useTranslations("common");
  const [mode, setMode] = useState<"1v1" | "4p">("1v1");
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  // Load current user id
  useEffect(() => {
    profileClient.getMyProfile().then((res) => {
      if (res.success && res.data) setMyId(res.data.id);
    });
  }, []);

  const load = useCallback(async (m: "1v1" | "4p") => {
    setLoading(true);
    const res = await profileClient.getLeaderboard(50, m);
    if (res.success && res.data) setProfiles(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(mode);
  }, [mode, load]);

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* ─── Header ─── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-yellow-500" />
          <span className="text-lg font-bold tracking-tight">{t("title")}</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 py-8 sm:p-8">
        {/* ─── Tabs 1v1 / 4-player ─── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{t("heading")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "1v1" | "4p")}>
            <TabsList>
              <TabsTrigger value="1v1" className="gap-1.5">
                <Swords className="size-3.5" />
                {t("tab1v1")}
              </TabsTrigger>
              <TabsTrigger value="4p" className="gap-1.5">
                <Users className="size-3.5" />
                {t("tab4p")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ─── Top 3 summary (podium stats) ─── */}
        {!loading && profiles.length >= 3 && (
          <div className="grid grid-cols-3 items-end gap-3 text-center">
            {[profiles[1], profiles[0], profiles[2]].map((p, visualIdx) => {
              if (!p) return null;
              const actualRank = visualIdx === 0 ? 2 : visualIdx === 1 ? 1 : 3;
              const elo = mode === "1v1" ? p.elo1v1 : p.elo4p;
              const avatarSizes = ["size-9", "size-12", "size-9"];
              return (
                <div key={p.id} className="flex flex-col items-center gap-1.5">
                  <span className="text-xl">{actualRank === 1 ? "🥇" : actualRank === 2 ? "🥈" : "🥉"}</span>
                  <Link
                    href={`/profile?id=${p.id}`}
                    className="flex w-full flex-col items-center gap-1.5 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/60"
                  >
                    <div className={`relative ${avatarSizes[visualIdx]} shrink-0`}>
                      {p.avatarUrl ? (
                        <Image
                          src={p.avatarUrl}
                          alt={p.pseudo}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className={`flex ${avatarSizes[visualIdx]} items-center justify-center rounded-full bg-muted text-sm font-bold`}>
                          {p.pseudo[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium truncate w-full text-center">{p.pseudo}</span>
                    <span className="text-sm font-bold tabular-nums">{elo}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Full list ─── */}
        <div className="flex flex-col gap-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">{t("loading")}</span>
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <TrendingUp className="size-8 opacity-40" />
              <p className="text-sm">{t("noGames")}</p>
            </div>
          ) : (
            profiles.map((profile, idx) => (
              <LeaderboardRow
                key={profile.id}
                profile={profile}
                rank={idx + 1}
                mode={mode}
                isMe={profile.id === myId}
                t={t}
              />
            ))
          )}
        </div>

        {/* ─── Info ─── */}
        {!loading && profiles.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {t("eloNote")}
          </p>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>{tc("copyright")}</span>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            {tc("pricing")}
          </Link>
          <Link href="/how-to-play" className="hover:text-foreground transition-colors">
            {tc("howToPlay")}
          </Link>
          <Link href="/ranks" className="hover:text-foreground transition-colors">
            {tc("ranks")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
