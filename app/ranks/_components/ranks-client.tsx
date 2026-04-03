"use client";

// =============================================================================
// PAGE — /ranks — Rank Tiers Description
// =============================================================================

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Shield,
  Medal,
  Gem,
  Crown,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RANK_DEFINITIONS, type RankDefinition } from "@/core/ranks";

// =============================================================================
// Helpers
// =============================================================================

function getRankIcon(icon: string, className: string) {
  switch (icon) {
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

function RankCard({ rank, index, t }: { rank: RankDefinition; index: number; t: ReturnType<typeof useTranslations<"ranksPage">> }) {
  const eloRange =
    rank.maxElo === null
      ? t("eloRangeOpen", { min: rank.minElo })
      : t("eloRange", { min: rank.minElo, max: rank.maxElo });

  return (
    <Card className={`${rank.borderColor} border`}>
      <CardContent className="flex items-center gap-4 py-5">
        {/* Icon */}
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${rank.bgColor}`}
        >
          {getRankIcon(rank.icon, `size-7 ${rank.color}`)}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-bold ${rank.color}`}>{rank.label}</h3>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {eloRange} ELO
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{t(`rank_${rank.tier}`)}</p>
        </div>

        {/* Tier number */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
          {index + 1}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Page
// =============================================================================

export function RanksClient() {
  const t = useTranslations("ranksPage");
  const tc = useTranslations("common");

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
          <TrendingUp className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">{t("title")}</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-4 py-10 sm:p-8">
        {/* ─── Hero ─── */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* ─── How it works ─── */}
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">{t("howItWorks")}</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {t.rich("rule1", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {t("rule2")}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {t.rich("rule3", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              {t("rule4")}
            </li>
          </ul>
        </div>

        {/* ─── Rank list ─── */}
        <div className="flex flex-col gap-3">
          {RANK_DEFINITIONS.map((rank, idx) => (
            <RankCard key={rank.tier} rank={rank} index={idx} t={t} />
          ))}
        </div>

        {/* ─── CTA ─── */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
          <Crown className="size-10 text-yellow-500" />
          <h2 className="text-xl font-bold">{t("readyToClimb")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("readyToClimbDesc")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">
                {t("playRanked")}
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leaderboard">
                <TrendingUp className="mr-2 size-4" />
                {tc("leaderboard")}
              </Link>
            </Button>
          </div>
        </div>
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
        </div>
      </footer>
    </div>
  );
}
