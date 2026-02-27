// =============================================================================
// FEATURE — Hook useMatchmaking
// =============================================================================
// Gère la file d'attente côté client avec polling du statut.
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { QueueStatus } from "@/types/api";
import { matchmakingClient } from "../api/matchmaking-client";

// =============================================================================
// Types
// =============================================================================

type MatchmakingState = "idle" | "searching" | "matched" | "error";

interface UseMatchmakingReturn {
  /** État du matchmaking */
  state: MatchmakingState;
  /** Détails de la file (si en recherche) */
  queueStatus: QueueStatus | null;
  /** Erreur éventuelle */
  error: string | null;
  /** Temps d'attente formaté */
  waitTime: string;
  /** Actions */
  actions: {
    /** Lancer la recherche */
    search: (gameMode: "NORMAL" | "RANKED", playerCount: 2 | 4) => Promise<void>;
    /** Annuler la recherche */
    cancel: () => Promise<void>;
  };
}

// =============================================================================
// Hook
// =============================================================================

const POLL_INTERVAL_MS = 2000; // Polling toutes les 2s

export function useMatchmaking(displayName: string): UseMatchmakingReturn {
  const router = useRouter();
  const [state, setState] = useState<MatchmakingState>("idle");
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState(0);

  const entryIdRef = useRef<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Nettoyage des timers ───
  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // ─── Polling du statut ───
  const pollStatus = useCallback(async () => {
    const result = await matchmakingClient.getStatus();

    if (result.success && result.data) {
      setQueueStatus(result.data);

      if (result.data.status === "matched" && result.data.matchedGameId) {
        // Match trouvé → naviguer vers la partie
        setState("matched");
        cleanup();
        router.push(`/game/${result.data.matchedGameId}`);
      }
    }
  }, [cleanup, router]);

  // ─── Lancer la recherche ───
  const search = useCallback(
    async (gameMode: "NORMAL" | "RANKED", playerCount: 2 | 4 = 2) => {
      setError(null);
      setState("searching");
      setWaitSeconds(0);

      const result = await matchmakingClient.joinQueue({
        displayName,
        gameMode,
        playerCount,
      });

      if (!result.success || !result.data) {
        setError(result.error ?? "Impossible de rejoindre la file.");
        setState("error");
        return;
      }

      entryIdRef.current = result.data.entryId;

      // Démarrer le polling
      pollingRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);

      // Démarrer le timer d'attente
      timerRef.current = setInterval(() => {
        setWaitSeconds((prev) => prev + 1);
      }, 1000);

      // Premier poll immédiat
      await pollStatus();
    },
    [displayName, pollStatus],
  );

  // ─── Annuler la recherche ───
  const cancel = useCallback(async () => {
    cleanup();

    if (entryIdRef.current) {
      await matchmakingClient.leaveQueue({
        queueEntryId: entryIdRef.current,
      });
      entryIdRef.current = null;
    }

    setState("idle");
    setQueueStatus(null);
    setWaitSeconds(0);
  }, [cleanup]);

  // ─── Formatter le temps d'attente ───
  const waitTime = formatWaitTime(waitSeconds);

  return {
    state,
    queueStatus,
    error,
    waitTime,
    actions: { search, cancel },
  };
}

// =============================================================================
// Helpers
// =============================================================================

function formatWaitTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;

  if (min === 0) return `${sec}s`;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}
