// =============================================================================
// FEATURE — Hook useGame
// =============================================================================
// Hook principal pour gérer l'état du jeu côté client.
// Gère : état UI, appels API, abonnements Realtime.
// AUCUNE logique métier — tout est délégué au serveur.
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PublicGameState } from "@/types/api";
import { gameClient } from "../api/game-client";
import { subscribeToGame } from "@/lib/realtime/game-channel";

// =============================================================================
// Types
// =============================================================================

interface UseGameOptions {
  /** ID de la partie */
  gameId: string;
  /** ID du joueur courant */
  playerId: string;
}

interface UseGameReturn {
  /** État du jeu (null si pas encore chargé) */
  gameState: PublicGameState | null;
  /** Chargement en cours */
  isLoading: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Actions disponibles */
  actions: {
    placeBid: (quantity: number, faceValue: number) => Promise<void>;
    callChallenge: () => Promise<void>;
    nextRound: () => Promise<void>;
    startGame: () => Promise<void>;
    surrender: () => Promise<void>;
    refresh: () => Promise<void>;
  };
}

// =============================================================================
// Hook
// =============================================================================

export function useGame({ gameId, playerId }: UseGameOptions): UseGameReturn {
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ===========================================================================
  // Charger l'état initial
  // ===========================================================================

  const loadGameState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await gameClient.getGameState(gameId);

    if (result.success && result.data) {
      setGameState(result.data);
    } else {
      setError(result.error ?? "Unable to load game.");
    }

    setIsLoading(false);
  }, [gameId]);

  // ===========================================================================
  // Abonnement Realtime
  // ===========================================================================

  useEffect(() => {
    // Charger l'état initial
    loadGameState();

    // S'abonner aux mises à jour temps réel
    unsubscribeRef.current = subscribeToGame(gameId, (newState) => {
      setGameState(newState);
    });

    // Cleanup
    return () => {
      unsubscribeRef.current?.();
    };
  }, [gameId, loadGameState]);

  // ===========================================================================
  // Actions
  // ===========================================================================

  const placeBid = useCallback(
    async (quantity: number, faceValue: number) => {
      setError(null);
      const result = await gameClient.placeBid({ gameId, quantity, faceValue });

      if (result.success && result.data) {
        setGameState(result.data);
      } else {
        setError(result.error ?? "Erreur lors de l'enchère.");
      }
    },
    [gameId],
  );

  const callChallenge = useCallback(async () => {
    setError(null);
    const result = await gameClient.callChallenge({ gameId });

    if (result.success && result.data) {
      setGameState(result.data);
    } else {
      setError(result.error ?? "Erreur lors de la contestation.");
    }
  }, [gameId]);

  const nextRound = useCallback(async () => {
    setError(null);
    const result = await gameClient.nextRound({ gameId });

    if (result.success && result.data) {
      setGameState(result.data);
    } else {
      setError(result.error ?? "Erreur lors du passage au round suivant.");
    }
  }, [gameId]);

  const startGame = useCallback(async () => {
    setError(null);
    const result = await gameClient.startGame({ gameId });

    if (result.success && result.data) {
      setGameState(result.data);
    } else {
      setError(result.error ?? "Erreur lors du démarrage.");
    }
  }, [gameId]);

  const surrenderGame = useCallback(async () => {
    setError(null);
    const result = await gameClient.surrender({ gameId });

    if (result.success && result.data) {
      setGameState(result.data);
    } else {
      setError(result.error ?? "Erreur lors de l'abandon.");
    }
  }, [gameId]);

  // ===========================================================================
  // Retour
  // ===========================================================================

  return {
    gameState,
    isLoading,
    error,
    actions: {
      placeBid,
      callChallenge,
      nextRound,
      startGame,
      surrender: surrenderGame,
      refresh: loadGameState,
    },
  };
}
