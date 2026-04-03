// =============================================================================
// PAGE — /how-to-play — Règles complètes du Perudo / Dixo
// =============================================================================

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

const BASE_URL = "https://dixo-game.com";

export const metadata: Metadata = {
  title: "How to Play Liar's Dice (Perudo) — Rules & Strategy Guide",
  description:
    "Complete rules for Dixo (Liar's Dice / Perudo): bidding, the Paco wild die, challenge resolution, game modes, ELO ranking, and strategy tips. 2-6 players, 5-15 min per game.",
  alternates: {
    canonical: `${BASE_URL}/how-to-play`,
  },
  openGraph: {
    title: "How to Play Dixo — Liar's Dice Rules & Strategy Guide",
    description:
      "Learn to play Dixo (Liar's Dice / Perudo). Complete rules covering bidding, Paco wild dice, challenge resolution, and winning strategies.",
    url: `${BASE_URL}/how-to-play`,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Dixo" }],
  },
};
import {
  ArrowLeft,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Swords,
  Trophy,
  Zap,
  Users,
  Shield,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// Helpers
// =============================================================================

function DicePip({ value }: { value: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const icons = { 1: Dice1, 2: Dice2, 3: Dice3, 4: Dice4, 5: Dice5, 6: Dice6 };
  const Icon = icons[value];
  const isPaco = value === 1;
  return (
    <Icon
      className={`size-10 ${isPaco ? "text-yellow-400" : "text-foreground"}`}
      strokeWidth={1.5}
    />
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div className="flex flex-col gap-1 pt-0.5">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function RuleCard({
  icon,
  title,
  children,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-yellow-500/40 bg-yellow-500/5" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}

function TipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border bg-muted/40 p-4">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-yellow-400" />
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

// =============================================================================
// Page
// =============================================================================

const howToPlayJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${BASE_URL}/how-to-play#article`,
  headline: "How to Play Dixo — Liar's Dice Rules and Strategy Guide",
  description:
    "Complete rules for Dixo (Liar's Dice / Perudo): learn how bidding works, the Paco wild die rule, challenge resolution, game modes, and strategy tips.",
  url: `${BASE_URL}/how-to-play`,
  image: {
    "@type": "ImageObject",
    url: `${BASE_URL}/icon-512.png`,
    width: 512,
    height: 512,
  },
  datePublished: "2025-01-01",
  dateModified: "2026-04-03",
  inLanguage: "en",
  author: { "@id": `${BASE_URL}/#organization` },
  about: { "@id": `${BASE_URL}/#game` },
  publisher: { "@id": `${BASE_URL}/#organization` },
  isPartOf: { "@id": `${BASE_URL}/#website` },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "How to Play",
        item: `${BASE_URL}/how-to-play`,
      },
    ],
  },
};

export default async function HowToPlayPage() {
  const t = await getTranslations("howToPlayPage");
  const tc = await getTranslations("common");

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToPlayJsonLd) }}
      />
      {/* ─── Header ─── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Dice5 className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">{t("title")}</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 p-4 py-10 sm:p-8">
        {/* ─── Hero ─── */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("heading")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* ─── Quick facts ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("quickFacts.players"), value: t("quickFacts.playersValue") },
            { label: t("quickFacts.dicePerPlayer"), value: t("quickFacts.dicePerPlayerValue") },
            { label: t("quickFacts.winCondition"), value: t("quickFacts.winConditionValue") },
            { label: t("quickFacts.avgGame"), value: t("quickFacts.avgGameValue") },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-4 text-center"
            >
              <span className="text-xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* ─── Objective ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t("objective.title")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.rich("objective.description", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}
          </p>
        </section>

        {/* ─── A round step by step ─── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">{t("steps.title")}</h2>
          <div className="flex flex-col gap-5">
            <Step number={1} title={t("steps.step1Title")}>
              {t.rich("steps.step1", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}
            </Step>
            <Step number={2} title={t("steps.step2Title")}>
              {t.rich("steps.step2", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>, badge: (chunks) => <Badge variant="outline">{chunks}</Badge>, em: (chunks) => <em>{chunks}</em> })}
            </Step>
            <Step number={3} title={t("steps.step3Title")}>
              {t("steps.step3Intro")}
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  {t.rich("steps.step3Raise", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}
                </li>
                <li>
                  {t.rich("steps.step3Challenge", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}
                </li>
              </ul>
            </Step>
            <Step number={4} title={t("steps.step4Title")}>
              {t("steps.step4Intro")}
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  {t.rich("steps.step4Correct", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>, destructive: (chunks) => <span className="text-destructive font-medium">{chunks}</span> })}
                </li>
                <li>
                  {t.rich("steps.step4Wrong", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>, destructive: (chunks) => <span className="text-destructive font-medium">{chunks}</span> })}
                </li>
              </ul>
            </Step>
            <Step number={5} title={t("steps.step5Title")}>
              {t("steps.step5")}
            </Step>
          </div>
        </section>

        {/* ─── Paco / Joker ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DicePip value={1} />
            {t("paco.title")}
          </h2>

          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="pt-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                {t.rich("paco.description", { yellow: (chunks) => <span className="font-bold text-yellow-500">{chunks}</span>, strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span> })}
              </p>
              <p className="mt-3">
                {t.rich("paco.example", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-400" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                {t.rich("paco.biddingOnPacos", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong>, em: (chunks) => <em>{chunks}</em> })}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-400" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                {t.rich("paco.switchingBack", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Die faces visual ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t("dice.title")}</h2>
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border bg-card p-6">
            {([1, 2, 3, 4, 5, 6] as const).map((v) => (
              <div key={v} className="flex flex-col items-center gap-2">
                <DicePip value={v} />
                <span className="text-xs text-muted-foreground">
                  {v === 1 ? t("dice.paco") : t("dice.face", { value: v })}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Game modes ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t("gameModes.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <RuleCard icon={<Swords className="size-4 text-blue-500" />} title={t("gameModes.normalTitle")}>
              {t("gameModes.normalDesc")}
            </RuleCard>
            <RuleCard
              icon={<Trophy className="size-4 text-yellow-500" />}
              title={t("gameModes.rankedTitle")}
              highlight
            >
              {t.rich("gameModes.rankedDesc", { strong: (chunks) => <strong>{chunks}</strong> })}
            </RuleCard>
            <RuleCard icon={<Shield className="size-4 text-purple-500" />} title={t("gameModes.privateTitle")}>
              {t("gameModes.privateDesc")}
            </RuleCard>
          </div>
        </section>

        {/* ─── ELO system ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="size-5 text-yellow-500" />
            {t("elo.title")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.rich("elo.description", { strong: (chunks) => <span className="font-medium text-foreground">{chunks}</span>, link: (chunks) => <Link href="/leaderboard" className="underline hover:text-foreground">{chunks}</Link> })}
          </p>
        </section>

        {/* ─── Strategy tips ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb className="size-5 text-yellow-400" />
            {t("tips.title")}
          </h2>
          <div className="flex flex-col gap-3">
            <TipCard>
              {t.rich("tips.tip1", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
            </TipCard>
            <TipCard>
              {t.rich("tips.tip2", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
            </TipCard>
            <TipCard>
              {t.rich("tips.tip3", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
            </TipCard>
            <TipCard>
              {t.rich("tips.tip4", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
            </TipCard>
            <TipCard>
              {t.rich("tips.tip5", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
            </TipCard>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
          <Dice5 className="size-10 text-primary" />
          <h2 className="text-xl font-bold">{t("cta.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("cta.description")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">
                {t("cta.playNow")}
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leaderboard">
                <Trophy className="mr-2 size-4" />
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
          <Link href="/ranks" className="hover:text-foreground transition-colors">
            {tc("ranks")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
