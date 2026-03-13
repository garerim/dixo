// =============================================================================
// PAGE — /ranks — Rank Tiers Description
// =============================================================================

import Link from "next/link";
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

function RankCard({ rank, index }: { rank: RankDefinition; index: number }) {
  const eloRange =
    rank.maxElo === null
      ? `${rank.minElo}+`
      : `${rank.minElo} – ${rank.maxElo}`;

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
          <p className="text-sm text-muted-foreground">{rank.description}</p>
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

export default function RanksPage() {
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
          <span className="text-lg font-bold tracking-tight">Ranks</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 p-4 py-10 sm:p-8">
        {/* ─── Hero ─── */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Competitive Ranks
          </h1>
          <p className="mt-3 text-muted-foreground">
            Climb the ladder from Bronze to Master. Your rank is based on your
            ELO rating, updated after each ranked game.
          </p>
        </div>

        {/* ─── How it works ─── */}
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">How does it work?</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              Every player starts at <strong className="text-foreground">1,000 ELO</strong> (Bronze).
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              Win ranked games to gain ELO, lose them to drop.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              Separate ELO for <strong className="text-foreground">1v1</strong> and <strong className="text-foreground">4-player</strong> modes.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
              Your rank updates instantly after each game.
            </li>
          </ul>
        </div>

        {/* ─── Rank list ─── */}
        <div className="flex flex-col gap-3">
          {RANK_DEFINITIONS.map((rank, idx) => (
            <RankCard key={rank.tier} rank={rank} index={idx} />
          ))}
        </div>

        {/* ─── CTA ─── */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
          <Crown className="size-10 text-yellow-500" />
          <h2 className="text-xl font-bold">Ready to climb?</h2>
          <p className="text-sm text-muted-foreground">
            Play ranked games to earn ELO and unlock higher tiers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">
                Play ranked
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leaderboard">
                <TrendingUp className="mr-2 size-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>&copy; 2026 Dixo</span>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/how-to-play" className="hover:text-foreground transition-colors">
            How to play
          </Link>
        </div>
      </footer>
    </div>
  );
}
