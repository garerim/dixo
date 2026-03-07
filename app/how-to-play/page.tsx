// =============================================================================
// PAGE — /how-to-play — Règles complètes du Perudo / Dixo
// =============================================================================

import Link from "next/link";
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

export default function HowToPlayPage() {
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
          <Dice5 className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">How to Play</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 p-4 py-10 sm:p-8">
        {/* ─── Hero ─── */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dixo — Rules & Guide
          </h1>
          <p className="mt-3 text-muted-foreground">
            A dice bluffing game for 2 to 6 players. Roll in secret, bid on what
            you think is out there, and call out the liars — or get caught bluffing yourself.
          </p>
        </div>

        {/* ─── Quick facts ─── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Players", value: "2 – 6" },
            { label: "Dice per player", value: "5" },
            { label: "Win condition", value: "Last standing" },
            { label: "Avg. game", value: "5 – 15 min" },
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
          <h2 className="text-xl font-bold">Objective</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Be the <span className="font-medium text-foreground">last player with dice</span>.
            Each time a player loses a challenge, they lose one die. A player
            with no dice left is eliminated. The game ends when only one player
            remains.
          </p>
        </section>

        {/* ─── A round step by step ─── */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold">A Round, Step by Step</h2>
          <div className="flex flex-col gap-5">
            <Step number={1} title="Roll your dice in secret">
              At the start of each round, every player rolls their dice inside
              their cup and peeks at the result.{" "}
              <span className="font-medium text-foreground">
                Only you can see your own dice.
              </span>{" "}
              Other players see only how many dice you have left.
            </Step>
            <Step number={2} title="Make a bid">
              The starting player announces a bid:{" "}
              <span className="font-medium text-foreground">
                a quantity and a face value
              </span>
              . For example: <Badge variant="outline">"3 fours"</Badge> means
              you claim there are at least 3 dice showing a 4 across{" "}
              <em>all</em> players' dice combined.
            </Step>
            <Step number={3} title="Raise or challenge">
              Going clockwise, each player must either:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  <span className="font-medium text-foreground">Raise the bid</span>{" "}
                  — increase the quantity, increase the face value (for the same
                  quantity), or both.
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Call "Challenge!"
                  </span>{" "}
                  — if you think the previous bid is impossible.
                </li>
              </ul>
            </Step>
            <Step number={4} title="Reveal & resolve the challenge">
              When a challenge is called, all cups are lifted and every die is
              counted:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>
                  If the actual count is{" "}
                  <span className="font-medium text-foreground">
                    ≥ the bid quantity
                  </span>
                  : the bid was correct →{" "}
                  <span className="text-destructive font-medium">
                    the challenger loses a die
                  </span>
                  .
                </li>
                <li>
                  If the actual count is{" "}
                  <span className="font-medium text-foreground">
                    &lt; the bid quantity
                  </span>
                  : the bid was wrong →{" "}
                  <span className="text-destructive font-medium">
                    the bidder loses a die
                  </span>
                  .
                </li>
              </ul>
            </Step>
            <Step number={5} title="Next round">
              A new round begins. Players with 0 dice are eliminated. Play
              continues until one player remains.
            </Step>
          </div>
        </section>

        {/* ─── Paco / Joker ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DicePip value={1} />
            The Paco — Wild Dice
          </h2>

          <Card className="border-yellow-500/40 bg-yellow-500/5">
            <CardContent className="pt-5 text-sm text-muted-foreground leading-relaxed">
              <p>
                In Dixo,{" "}
                <span className="font-bold text-yellow-500">
                  dice showing a 1 (Paco)
                </span>{" "}
                are <span className="font-medium text-foreground">wild</span>.
                They count as any face value when resolving a bid on normal
                faces (2–6).
              </p>
              <p className="mt-3">
                <strong className="text-foreground">Example:</strong> The bid is
                "4 fives". There are 3 fives and 2 Pacos in play →
                actual count = <strong>5</strong> → bid is correct.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-400" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Bidding on Pacos:</strong>{" "}
                When you bid on face 1 directly (e.g. "2 Pacos"), Pacos are{" "}
                <em>no longer wild</em> — only actual 1s count. To switch from
                a normal bid to a Paco bid, the quantity must be at least{" "}
                <strong className="text-foreground">
                  half (rounded up)
                </strong>{" "}
                of the previous bid quantity.
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-orange-400" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">
                  Switching back to normal faces:
                </strong>{" "}
                Going from a Paco bid back to a normal face bid requires the
                quantity to be at least{" "}
                <strong className="text-foreground">
                  double the Paco quantity + 1
                </strong>
                . Example: "2 Pacos" → minimum normal bid is "5 [any face]".
              </div>
            </div>
          </div>
        </section>

        {/* ─── Die faces visual ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">The Dice</h2>
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border bg-card p-6">
            {([1, 2, 3, 4, 5, 6] as const).map((v) => (
              <div key={v} className="flex flex-col items-center gap-2">
                <DicePip value={v} />
                <span className="text-xs text-muted-foreground">
                  {v === 1 ? "Paco (wild)" : `Face ${v}`}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Game modes ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">Game Modes</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <RuleCard icon={<Swords className="size-4 text-blue-500" />} title="Normal">
              Casual games with automatic matchmaking. No ELO at stake — perfect
              for learning or warming up.
            </RuleCard>
            <RuleCard
              icon={<Trophy className="size-4 text-yellow-500" />}
              title="Ranked"
              highlight
            >
              ELO-based matchmaking. Win to gain rating, lose to drop. Separate
              ratings for <strong>1v1</strong> and <strong>4-player</strong>{" "}
              formats.
            </RuleCard>
            <RuleCard icon={<Shield className="size-4 text-purple-500" />} title="Private">
              Create a game and share the 6-character code with friends. Up to 6
              players, no ELO impact.
            </RuleCard>
          </div>
        </section>

        {/* ─── ELO system ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="size-5 text-yellow-500" />
            ELO Ranking
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dixo uses a separate ELO for{" "}
            <span className="font-medium text-foreground">1v1</span> and{" "}
            <span className="font-medium text-foreground">4-player</span>{" "}
            ranked games. Both start at{" "}
            <span className="font-medium text-foreground">1 000</span>. ELO is
            calculated based on the expected win probability vs. your opponent.
            The further apart your ratings, the more you gain (or lose) for an
            upset. Ranking is visible on the public{" "}
            <Link href="/leaderboard" className="underline hover:text-foreground">
              leaderboard
            </Link>
            .
          </p>
        </section>

        {/* ─── Strategy tips ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Lightbulb className="size-5 text-yellow-400" />
            Strategy Tips
          </h2>
          <div className="flex flex-col gap-3">
            <TipCard>
              <strong className="text-foreground">Count from your own dice.</strong>{" "}
              If you hold 2 fives and there are 10 dice in play, statistically
              expect ~1.7 more fives from other players (each die has a 1-in-6
              chance per face, but Pacos add ~1/6 more). Use this to calibrate
              your bids.
            </TipCard>
            <TipCard>
              <strong className="text-foreground">Don't always challenge a big bid.</strong>{" "}
              Sometimes letting a risky bid pass forces your opponent to keep
              raising until they overreach. Pick your challenges carefully.
            </TipCard>
            <TipCard>
              <strong className="text-foreground">Bid on Pacos to reset the pressure.</strong>{" "}
              Switching to a Paco bid cuts the required quantity in half —
              useful when you're forced to make a bid you can't honestly raise.
            </TipCard>
            <TipCard>
              <strong className="text-foreground">Watch the dice counts.</strong>{" "}
              A player down to 1 die is predictable — they can only have one
              value. Use that information to your advantage.
            </TipCard>
            <TipCard>
              <strong className="text-foreground">In 4-player games, let others fight first.</strong>{" "}
              Conserving your dice while opponents knock each other out is a
              valid strategy — the last rounds are 1v1 and your dice count
              matters.
            </TipCard>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
          <Dice5 className="size-10 text-primary" />
          <h2 className="text-xl font-bold">Ready to play?</h2>
          <p className="text-sm text-muted-foreground">
            Jump into a Normal game to practice, or go straight to Ranked when
            you feel confident.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/">
                Play now
                <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leaderboard">
                <Trophy className="mr-2 size-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>© 2026 Dixo</span>
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
