"use client";

import { useState, useEffect, useCallback } from "react";
import { tournamentClient } from "../api/tournament-client";
import { subscribeToTournament } from "@/lib/realtime/tournament-channel";
import type { TournamentRow } from "@/types/database";

export function useTournament(tournamentId: string) {
  const [tournament, setTournament] = useState<TournamentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState(0);

  // Fetch initial data
  const refresh = useCallback(async () => {
    const result = await tournamentClient.getById(tournamentId);
    if (result.success) setTournament(result.data!);
    setIsLoading(false);
  }, [tournamentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToTournament(tournamentId, {
      onBracketUpdate: (updated) => setTournament(updated),
      onParticipantChange: () => refresh(), // re-fetch to get updated count
    });
    return unsubscribe;
  }, [tournamentId, refresh]);

  // Actions
  const register = useCallback(async () => {
    const result = await tournamentClient.register(tournamentId);
    if (result.success) await refresh();
    return result;
  }, [tournamentId, refresh]);

  const unregister = useCallback(async () => {
    const result = await tournamentClient.unregister(tournamentId);
    if (result.success) await refresh();
    return result;
  }, [tournamentId, refresh]);

  return { tournament, isLoading, participantCount, register, unregister, refresh };
}
