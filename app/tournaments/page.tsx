"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Dice5, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTournamentList } from "@/features/tournament/hooks/use-tournament-list";
import { TournamentList } from "@/features/tournament/components/tournament-list";

export default function TournamentsPage() {
  const t = useTranslations("tournament");
  const { tournaments, isLoading } = useTournamentList();

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
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

      <main className="mx-auto w-full max-w-3xl p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <TournamentList tournaments={tournaments} isLoading={isLoading} />
      </main>
    </div>
  );
}
