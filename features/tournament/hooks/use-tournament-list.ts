"use client";

import { useState, useEffect, useCallback } from "react";
import { tournamentClient } from "../api/tournament-client";
import type { TournamentRow } from "@/types/database";

export function useTournamentList() {
  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const result = await tournamentClient.list();
    if (result.success) setTournaments(result.data!);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tournaments, isLoading, refresh };
}
