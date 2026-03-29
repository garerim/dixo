"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Trophy, Swords, Clock, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { BracketState, BracketMatch } from "@/core/tournament";

interface TournamentBracketProps {
  bracket: BracketState;
  currentUserId?: string;
}

export function TournamentBracket({ bracket, currentUserId }: TournamentBracketProps) {
  const t = useTranslations("tournament");

  const roundNames: string[] = [];
  for (let i = 1; i <= bracket.totalRounds; i++) {
    const remaining = bracket.totalRounds - i;
    if (remaining === 0) roundNames.push(t("finals"));
    else if (remaining === 1) roundNames.push(t("semifinals"));
    else if (remaining === 2) roundNames.push(t("quarterfinals"));
    else roundNames.push(t("round", { round: i }));
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max p-4">
        {Array.from({ length: bracket.totalRounds }, (_, roundIdx) => {
          const round = roundIdx + 1;
          const roundMatches = bracket.matches.filter(
            (m) => m.round === round && m.bracketSide === "winners",
          );

          return (
            <div key={round} className="flex flex-col gap-2">
              <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {roundNames[roundIdx] ?? t("round", { round })}
              </h3>
              <div
                className="flex flex-col justify-around gap-4"
                style={{ minHeight: roundIdx === 0 ? "auto" : `${roundMatches.length * 120}px` }}
              >
                {roundMatches
                  .sort((a, b) => a.matchIndex - b.matchIndex)
                  .map((match) => (
                    <MatchCard
                      key={`${match.round}-${match.matchIndex}`}
                      match={match}
                      seeds={bracket.seeds}
                      currentUserId={currentUserId}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  seeds,
  currentUserId,
}: {
  match: BracketMatch;
  seeds: Record<string, number>;
  currentUserId?: string;
}) {
  const isComplete = match.status === "completed" || match.status === "bye";
  const isInProgress = match.status === "in_progress";
  const isPending = match.status === "pending";

  return (
    <div
      className={cn(
        "w-52 rounded-lg border bg-card p-2 transition-colors",
        isInProgress && "border-primary/50 bg-primary/5",
        isComplete && "opacity-80",
      )}
    >
      <PlayerSlot
        playerId={match.player1Id}
        seed={match.player1Id ? seeds[match.player1Id] : undefined}
        isWinner={match.winnerId === match.player1Id}
        isMe={match.player1Id === currentUserId}
        isPending={isPending}
      />
      <div className="my-1 border-t" />
      <PlayerSlot
        playerId={match.player2Id}
        seed={match.player2Id ? seeds[match.player2Id] : undefined}
        isWinner={match.winnerId === match.player2Id}
        isMe={match.player2Id === currentUserId}
        isPending={isPending}
      />
      {isInProgress && (
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-primary">
          <Swords className="size-3" />
          <span>Live</span>
        </div>
      )}
    </div>
  );
}

function PlayerSlot({
  playerId,
  seed,
  isWinner,
  isMe,
  isPending,
}: {
  playerId: string | null;
  seed?: number;
  isWinner: boolean;
  isMe: boolean;
  isPending: boolean;
}) {
  if (!playerId) {
    return (
      <div className="flex h-8 items-center px-2 text-xs text-muted-foreground">
        {isPending ? (
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            TBD
          </span>
        ) : (
          <span>BYE</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded px-2 text-sm",
        isWinner && "bg-green-500/10 font-semibold",
        isMe && "ring-1 ring-primary/50",
      )}
    >
      {seed && (
        <span className="text-xs text-muted-foreground">#{seed}</span>
      )}
      <span className={cn("flex-1 truncate", isWinner && "text-green-400")}>
        {playerId.slice(0, 8)}...
      </span>
      {isWinner && <Check className="size-3 text-green-500" />}
    </div>
  );
}

