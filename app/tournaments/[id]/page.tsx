"use client";

import { use, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useTournament } from "@/features/tournament/hooks/use-tournament";
import { TournamentLobby } from "@/features/tournament/components/tournament-lobby";
import { TournamentBracket } from "@/features/tournament/components/tournament-bracket";
import type { BracketState } from "@/core/tournament";

export default function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("tournament");
  const { user } = useAuth();
  const { tournament, isLoading, participantCount, register, unregister } = useTournament(id);
  const [isRegistered, setIsRegistered] = useState(false);

  // Check if user is registered (simple client-side check via participants)
  // This would need improvement with actual participant list
  useEffect(() => {
    // For now, rely on the register/unregister actions updating state
  }, [tournament, user]);

  if (isLoading || !tournament) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isRegistrationPhase = tournament.status === "registration";
  const bracket = tournament.bracket as unknown as BracketState;
  const hasBracket = bracket?.matches && bracket.matches.length > 0;

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tournaments">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-yellow-500" />
          <span className="text-lg font-bold tracking-tight">{tournament.name}</span>
        </div>
      </header>

      <main className="flex-1 p-4">
        {isRegistrationPhase && (
          <TournamentLobby
            tournament={tournament}
            participantCount={participantCount}
            isRegistered={isRegistered}
            onRegister={async () => {
              const result = await register();
              if (result.success) setIsRegistered(true);
              return result;
            }}
            onUnregister={async () => {
              const result = await unregister();
              if (result.success) setIsRegistered(false);
              return result;
            }}
          />
        )}

        {hasBracket && (
          <div className="mt-6">
            <h2 className="mb-4 text-xl font-bold">{t("bracket")}</h2>
            <TournamentBracket
              bracket={bracket}
              currentUserId={user?.id}
            />
          </div>
        )}

        {tournament.status === "completed" && tournament.winner_id && (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
            <Trophy className="size-12 text-yellow-500" />
            <h2 className="text-2xl font-bold">{t("completed")}</h2>
            <p className="text-sm text-muted-foreground">{t("winner")}: {tournament.winner_id.slice(0, 8)}...</p>
          </div>
        )}
      </main>
    </div>
  );
}
