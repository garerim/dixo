// =============================================================================
// FEATURE — Hook useBotGame
// =============================================================================
// Client-side game loop against bots. Mirrors the useGame interface but runs
// the pure game engine locally — no API calls, no DB, no Realtime.
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { PublicGameState, UpdateSettingsRequest } from "@/types/api";
import type { GameState } from "@/core/game-engine/types";
import { GamePhase, GameMode } from "@/core/game-engine/types";
import {
  createInitialGameState,
  addPlayer,
  startGame as engineStartGame,
  placeBid as enginePlaceBid,
  callChallenge as engineCallChallenge,
  startNextRound as engineStartNextRound,
  surrender as engineSurrender,
} from "@/core/game-engine/state-machine";
import { sanitizeGameStateForPlayer } from "@/services/game-state-sanitizer";
import {
  computeBotAction,
  getBotThinkingDelay,
  createBotProfiles,
  isBotPlayer,
} from "@/core/bot";
import type { BotDifficulty, BotProfile } from "@/core/bot";

// =============================================================================
// Types
// =============================================================================

export interface UseBotGameOptions {
  /** Human player info */
  player: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    subscription?: string;
    diceSkin?: string;
  };
  /** Number of bots (1 for 1v1, 3 for 4-player) */
  botCount: 1 | 3;
  /** Bot difficulty */
  difficulty: BotDifficulty;
  /** Game configuration overrides */
  config?: {
    initialDiceCount?: number;
    pacosAreWild?: boolean;
  };
}

interface UseBotGameReturn {
  /** Sanitized game state for the human player */
  gameState: PublicGameState | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Bot profiles (for UI display) */
  bots: BotProfile[];
  /** Available actions */
  actions: {
    placeBid: (quantity: number, faceValue: number) => Promise<void>;
    callChallenge: () => Promise<void>;
    nextRound: () => Promise<void>;
    startGame: () => Promise<void>;
    updateSettings: (settings: Omit<UpdateSettingsRequest, "gameId">) => Promise<void>;
    leaveGame: () => Promise<boolean>;
    surrender: () => Promise<void>;
    refresh: () => Promise<void>;
    /** Restart a new bot game with same settings */
    restart: () => void;
  };
}

// =============================================================================
// Hook
// =============================================================================

export function useBotGame({
  player,
  botCount,
  difficulty,
  config: configOverrides,
}: UseBotGameOptions): UseBotGameReturn {
  const [fullState, setFullState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bots, setBots] = useState<BotProfile[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isProcessingRef = useRef(false);
  const scheduleBotTurnsRef = useRef<(state: GameState) => void>(() => {});

  // ── Cleanup timeouts on unmount ──
  useEffect(() => {
    return () => {
      for (const t of timeoutsRef.current) clearTimeout(t);
      timeoutsRef.current = [];
    };
  }, []);

  // ── Sanitize state for UI ──
  const gameState: PublicGameState | null = fullState
    ? sanitizeGameStateForPlayer(fullState, player.id)
    : null;

  // ── Initialize game ──
  const initGame = useCallback(() => {
    // Clear any pending bot actions
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
    isProcessingRef.current = false;

    const newBots = createBotProfiles(botCount, difficulty);
    setBots(newBots);

    // Create game state
    let state = createInitialGameState(
      `training-${Date.now()}`,
      player,
      GameMode.PRIVATE,
      {
        minPlayers: 2,
        maxPlayers: botCount + 1,
        initialDiceCount: configOverrides?.initialDiceCount ?? 5,
        pacosAreWild: configOverrides?.pacosAreWild ?? true,
        turnTimer: null,
      },
    );

    // Add bots
    for (const bot of newBots) {
      const result = addPlayer(state, {
        id: bot.id,
        displayName: bot.displayName,
      });
      if (result.success) {
        state = result.state;
      }
    }

    setFullState(state);
    setError(null);
  }, [player, botCount, difficulty, configOverrides]);

  // Init on mount — use ref to avoid lint warning about setState in effect
  const hasInitRef = useRef(false);
  if (!hasInitRef.current) {
    hasInitRef.current = true;
    // Lazy initialization — runs synchronously on first render
  }
  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Schedule bot turns ──
  const scheduleBotTurns = useCallback(
    (state: GameState) => {
      if (isProcessingRef.current) return;

      const processBotTurn = (currentState: GameState) => {
        // Check if game is over or not in bidding phase
        if (currentState.phase !== GamePhase.BIDDING) {
          isProcessingRef.current = false;
          return;
        }

        const currentPlayer =
          currentState.players[currentState.currentPlayerIndex];
        if (!currentPlayer || !isBotPlayer(currentPlayer.id)) {
          isProcessingRef.current = false;
          return;
        }

        isProcessingRef.current = true;

        const delay = getBotThinkingDelay(difficulty);
        const timeout = setTimeout(() => {
          const action = computeBotAction(
            currentState,
            currentPlayer.id,
            difficulty,
          );

          let result;
          if (action.type === "bid") {
            result = enginePlaceBid(currentState, {
              playerId: currentPlayer.id,
              quantity: action.quantity,
              faceValue: action.faceValue,
            });
          } else {
            result = engineCallChallenge(currentState, currentPlayer.id);
          }

          if (result.success) {
            setFullState(result.state);

            // If result phase, auto-advance after delay
            if (
              result.state.phase === GamePhase.RESULT ||
              result.state.phase === GamePhase.GAME_OVER
            ) {
              isProcessingRef.current = false;
              if (result.state.phase === GamePhase.RESULT) {
                const nextTimeout = setTimeout(() => {
                  setFullState((prev) => {
                    if (!prev || prev.phase !== GamePhase.RESULT) return prev;
                    const nextResult = engineStartNextRound(prev);
                    if (nextResult.success) {
                      // Schedule next bot turn via ref to avoid circular dep
                      setTimeout(
                        () => scheduleBotTurnsRef.current(nextResult.state),
                        50,
                      );
                      return nextResult.state;
                    }
                    return prev;
                  });
                }, 2500);
                timeoutsRef.current.push(nextTimeout);
              }
              return;
            }

            // Continue processing if next player is also a bot
            processBotTurn(result.state);
          } else {
            // Bot action failed — challenge as fallback
            if (action.type === "bid" && currentState.currentBid) {
              const challengeResult = engineCallChallenge(
                currentState,
                currentPlayer.id,
              );
              if (challengeResult.success) {
                setFullState(challengeResult.state);
                isProcessingRef.current = false;
              }
            }
            isProcessingRef.current = false;
          }
        }, delay);

        timeoutsRef.current.push(timeout);
      };

      processBotTurn(state);
    },
    [difficulty],
  );

  // Keep the ref in sync
  useEffect(() => {
    scheduleBotTurnsRef.current = scheduleBotTurns;
  }, [scheduleBotTurns]);

  // Watch for state changes and trigger bot turns
  useEffect(() => {
    if (!fullState) return;
    if (fullState.phase !== GamePhase.BIDDING) return;

    const currentPlayer = fullState.players[fullState.currentPlayerIndex];
    if (currentPlayer && isBotPlayer(currentPlayer.id)) {
      scheduleBotTurns(fullState);
    }
  }, [fullState, scheduleBotTurns]);

  // ── Human actions ──

  const placeBid = useCallback(
    async (quantity: number, faceValue: number) => {
      if (!fullState) return;
      setError(null);

      const result = enginePlaceBid(fullState, {
        playerId: player.id,
        quantity,
        faceValue,
      });

      if (result.success) {
        setFullState(result.state);
      } else {
        setError(result.error ?? "Invalid bid.");
      }
    },
    [fullState, player.id],
  );

  const callChallengeAction = useCallback(async () => {
    if (!fullState) return;
    setError(null);

    const result = engineCallChallenge(fullState, player.id);

    if (result.success) {
      setFullState(result.state);

      // Auto-advance from RESULT after delay
      if (result.state.phase === GamePhase.RESULT) {
        const timeout = setTimeout(() => {
          setFullState((prev) => {
            if (!prev || prev.phase !== GamePhase.RESULT) return prev;
            const nextResult = engineStartNextRound(prev);
            return nextResult.success ? nextResult.state : prev;
          });
        }, 2500);
        timeoutsRef.current.push(timeout);
      }
    } else {
      setError(result.error ?? "Cannot challenge.");
    }
  }, [fullState, player.id]);

  const nextRound = useCallback(async () => {
    if (!fullState) return;
    setError(null);

    const result = engineStartNextRound(fullState);
    if (result.success) {
      setFullState(result.state);
    } else {
      setError(result.error ?? "Cannot start next round.");
    }
  }, [fullState]);

  const startGameAction = useCallback(async () => {
    if (!fullState) return;
    setError(null);

    const result = engineStartGame(fullState, player.id);
    if (result.success) {
      setFullState(result.state);
    } else {
      setError(result.error ?? "Cannot start game.");
    }
  }, [fullState, player.id]);

  const surrenderAction = useCallback(async () => {
    if (!fullState) return;
    setError(null);

    const result = engineSurrender(fullState, player.id);
    if (result.success) {
      setFullState(result.state);
    } else {
      setError(result.error ?? "Cannot surrender.");
    }
  }, [fullState, player.id]);

  const leaveGame = useCallback(async (): Promise<boolean> => {
    // Just reset — no DB cleanup needed
    initGame();
    return true;
  }, [initGame]);

  // No-ops for bot mode
  const updateSettings = useCallback(async () => {}, []);
  const refresh = useCallback(async () => {}, []);

  return {
    gameState,
    isLoading: false,
    error,
    bots,
    actions: {
      placeBid,
      callChallenge: callChallengeAction,
      nextRound,
      startGame: startGameAction,
      updateSettings,
      leaveGame,
      surrender: surrenderAction,
      refresh,
      restart: initGame,
    },
  };
}
