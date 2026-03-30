// =============================================================================
// FEATURE — Hook useTutorialGame
// =============================================================================
// Orchestrates a scripted tutorial game. Uses the pure game engine with
// predetermined dice rolls and step-by-step bot actions.
// =============================================================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { PublicGameState } from "@/types/api";
import type { GameState } from "@/core/game-engine/types";
import { GamePhase, GameMode } from "@/core/game-engine/types";
import {
  createInitialGameState,
  addPlayer,
  startGame as engineStartGame,
  placeBid as enginePlaceBid,
  callChallenge as engineCallChallenge,
  startNextRound as engineStartNextRound,
} from "@/core/game-engine/state-machine";
import type { RandomGenerator } from "@/core/game-engine/dice";
import { sanitizeGameStateForPlayer } from "@/services/game-state-sanitizer";
import type { TutorialStep } from "../types";
import { TUTORIAL_STEPS } from "../tutorial-steps";

// =============================================================================
// Scripted random generator
// =============================================================================

/**
 * Creates a RandomGenerator that produces values mapping to specific dice faces.
 * rollDie does: Math.floor(random() * 6) + 1
 * So to get face N, we return (N - 1 + 0.01) / 6
 */
function createScriptedRandom(diceValues: number[]): RandomGenerator {
  let index = 0;
  return () => {
    if (index >= diceValues.length) {
      // Fallback to real random if we run out of scripted values
      return Math.random();
    }
    const face = diceValues[index++];
    return (face - 1 + 0.01) / 6;
  };
}

// =============================================================================
// Types
// =============================================================================

export interface UseTutorialGameReturn {
  /** Sanitized game state */
  gameState: PublicGameState | null;
  /** Current tutorial step */
  currentStep: TutorialStep | null;
  /** Current step index */
  stepIndex: number;
  /** Whether the tutorial is complete */
  isComplete: boolean;
  /** Whether we're in free-play mode */
  isFreePlay: boolean;
  /** Error message */
  error: string | null;
  /** Actions */
  actions: {
    /** Advance to next step (for click-continue steps) */
    advanceStep: () => void;
    /** Place a bid (validates against expected step) */
    placeBid: (quantity: number, faceValue: number) => void;
    /** Call challenge (validates against expected step) */
    callChallenge: () => void;
    /** Next round (during free-play) */
    nextRound: () => void;
    /** Restart the tutorial from the beginning */
    restart: () => void;
  };
}

// =============================================================================
// Constants
// =============================================================================

const PLAYER_ID = "tutorial-player";
const BOT_ID = "tutorial-bot";
const BOT_NAME = "Coach Dice";

// =============================================================================
// Hook
// =============================================================================

export function useTutorialGame(): UseTutorialGameReturn {
  const [fullState, setFullState] = useState<GameState | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFreePlay, setIsFreePlay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const steps = TUTORIAL_STEPS;
  const currentStep = stepIndex < steps.length ? steps[stepIndex] : null;

  // Cleanup
  useEffect(() => {
    return () => {
      for (const t of timeoutsRef.current) clearTimeout(t);
    };
  }, []);

  // ── Sanitized state for UI ──
  const gameState: PublicGameState | null = fullState
    ? sanitizeGameStateForPlayer(fullState, PLAYER_ID)
    : null;

  // ── Initialize game (LOBBY state with player + bot) ──
  const initGame = useCallback(() => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];

    let state = createInitialGameState(
      `tutorial-${Date.now()}`,
      { id: PLAYER_ID, displayName: "You" },
      GameMode.PRIVATE,
      {
        minPlayers: 2,
        maxPlayers: 2,
        initialDiceCount: 3,
        pacosAreWild: true,
        turnTimer: null,
      },
    );

    const addResult = addPlayer(state, {
      id: BOT_ID,
      displayName: BOT_NAME,
    });
    if (addResult.success) state = addResult.state;

    setFullState(state);
    setStepIndex(0);
    setIsComplete(false);
    setIsFreePlay(false);
    setGameStarted(false);
    setError(null);
  }, []);

  // Init on mount
  useEffect(() => {
    initGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start game with scripted dice ──
  const startGameWithDice = useCallback(
    (state: GameState, playerDice: number[], botDice: number[]) => {
      // Dice order follows player order: player first, then bot
      const allDice = [...playerDice, ...botDice];
      const random = createScriptedRandom(allDice);
      const result = engineStartGame(state, PLAYER_ID, random);
      if (result.success) {
        setFullState(result.state);
        setGameStarted(true);
        return result.state;
      }
      return state;
    },
    [],
  );

  // ── Start next round with scripted dice ──
  const startNextRoundWithDice = useCallback(
    (state: GameState, playerDice: number[], botDice: number[]) => {
      // Determine player order for this round - alive players only
      const alivePlayers = state.players.filter((p) => p.isAlive);
      const allDice: number[] = [];
      for (const p of alivePlayers) {
        if (p.id === PLAYER_ID) allDice.push(...playerDice);
        else allDice.push(...botDice);
      }
      const random = createScriptedRandom(allDice);
      const result = engineStartNextRound(state, random);
      if (result.success) {
        setFullState(result.state);
        return result.state;
      }
      return state;
    },
    [],
  );

  // ── Execute bot action (pure — does NOT call setFullState) ──
  const executeBotAction = useCallback(
    (
      state: GameState,
      action: { type: "bid"; quantity: number; faceValue: number } | { type: "challenge" },
    ): GameState => {
      let result;
      if (action.type === "bid") {
        result = enginePlaceBid(state, {
          playerId: BOT_ID,
          quantity: action.quantity,
          faceValue: action.faceValue,
        });
      } else {
        result = engineCallChallenge(state, BOT_ID);
      }
      if (result.success) {
        return result.state;
      }
      return state;
    },
    [],
  );

  // ── Advance to next step ──
  const advanceStep = useCallback(() => {
    if (!currentStep || isComplete) return;

    const nextIndex = stepIndex + 1;

    // Check if tutorial is done
    if (nextIndex >= steps.length) {
      setIsComplete(true);
      setStepIndex(nextIndex);
      return;
    }

    const nextStep = steps[nextIndex];

    // Handle the LEAVING step's side-effects:
    // If current step has scriptedDice, we need to start a round
    if (currentStep.scriptedDice && fullState) {
      const { player, bot } = currentStep.scriptedDice;
      if (!gameStarted) {
        // Start the game for the first time
        startGameWithDice(fullState, player, bot);
      } else if (fullState.phase === GamePhase.RESULT) {
        // Start next round
        startNextRoundWithDice(fullState, player, bot);
      }
    }

    // Enter free-play mode when LEAVING the free-play intro step
    if (currentStep.advanceCondition.type === "free-play") {
      setIsFreePlay(true);
      // Don't advance to next step — free-play takes over
      return;
    }

    // Handle the ENTERING step's side-effects:
    // If next step has a bot action, execute it after a brief delay
    if (nextStep.botAction && fullState) {
      const timeout = setTimeout(() => {
        setFullState((prev) => {
          if (!prev) return prev;
          return executeBotAction(prev, nextStep.botAction!);
        });
      }, 1000);
      timeoutsRef.current.push(timeout);
    }

    setStepIndex(nextIndex);
  }, [
    currentStep,
    isComplete,
    stepIndex,
    steps,
    fullState,
    gameStarted,
    startGameWithDice,
    startNextRoundWithDice,
    executeBotAction,
  ]);

  // ── Place bid (validates for guided steps) ──
  const placeBid = useCallback(
    (quantity: number, faceValue: number) => {
      if (!fullState) return;
      setError(null);

      // In guided mode, validate the expected bid
      if (
        currentStep &&
        currentStep.advanceCondition.type === "place-bid" &&
        !isFreePlay
      ) {
        const expected = currentStep.advanceCondition;
        if (quantity !== expected.quantity || faceValue !== expected.faceValue) {
          setError(
            `hint:${currentStep.messageKey}`,
          );
          return;
        }
      }

      const result = enginePlaceBid(fullState, {
        playerId: PLAYER_ID,
        quantity,
        faceValue,
      });

      if (result.success) {
        setFullState(result.state);

        // Auto-advance if this was a guided step
        if (!isFreePlay && currentStep?.advanceCondition.type === "place-bid") {
          // Small delay then advance (to show the bid landing)
          const timeout = setTimeout(() => advanceStep(), 500);
          timeoutsRef.current.push(timeout);
        }

        // In free-play, handle bot turn
        if (isFreePlay && result.state.phase === GamePhase.BIDDING) {
          const botPlayer =
            result.state.players[result.state.currentPlayerIndex];
          if (botPlayer?.id === BOT_ID) {
            const timeout = setTimeout(() => {
              setFullState((prev) => {
                if (!prev || prev.phase !== GamePhase.BIDDING) return prev;
                // Simple bot: challenge or raise by 1
                const bid = prev.currentBid;
                if (bid && bid.quantity >= 3) {
                  return executeBotAction(prev, { type: "challenge" });
                }
                const newQ = (bid?.quantity ?? 0) + 1;
                const face = bid?.faceValue ?? 3;
                return executeBotAction(prev, {
                  type: "bid",
                  quantity: newQ,
                  faceValue: face,
                });
              });
            }, 1500);
            timeoutsRef.current.push(timeout);
          }
        }
      } else {
        setError(result.error ?? "Invalid bid.");
      }
    },
    [fullState, currentStep, isFreePlay, advanceStep, executeBotAction],
  );

  // ── Call challenge ──
  const callChallengeAction = useCallback(() => {
    if (!fullState) return;
    setError(null);

    const result = engineCallChallenge(fullState, PLAYER_ID);
    if (result.success) {
      setFullState(result.state);

      // Auto-advance if guided
      if (!isFreePlay && currentStep?.advanceCondition.type === "call-challenge") {
        const timeout = setTimeout(() => advanceStep(), 500);
        timeoutsRef.current.push(timeout);
      }
    } else {
      setError(result.error ?? "Cannot challenge.");
    }
  }, [fullState, isFreePlay, currentStep, advanceStep]);

  // ── Next round (free-play mode) ──
  const nextRound = useCallback(() => {
    if (!fullState || fullState.phase !== GamePhase.RESULT) return;
    const result = engineStartNextRound(fullState);
    if (result.success) {
      setFullState(result.state);
    }
  }, [fullState]);

  // ── Auto-detect game over during free play ──
  useEffect(() => {
    if (
      isFreePlay &&
      fullState?.phase === GamePhase.GAME_OVER &&
      !isComplete
    ) {
      // Move to the "complete" step
      const completeIdx = steps.findIndex((s) => s.id === "complete");
      if (completeIdx !== -1) {
        setStepIndex(completeIdx);
        setIsFreePlay(false);
      }
    }
  }, [isFreePlay, fullState?.phase, isComplete, steps]);

  // ── Bot goes first in free-play mode ──
  useEffect(() => {
    if (!isFreePlay || !fullState || fullState.phase !== GamePhase.BIDDING) return;
    const current = fullState.players[fullState.currentPlayerIndex];
    if (current?.id !== BOT_ID) return;

    const timeout = setTimeout(() => {
      setFullState((prev) => {
        if (!prev || prev.phase !== GamePhase.BIDDING) return prev;
        const botPlayer = prev.players[prev.currentPlayerIndex];
        if (botPlayer?.id !== BOT_ID) return prev;
        // Simple bot: open with a low bid or raise
        const bid = prev.currentBid;
        if (!bid) {
          // Bot opens — bid 1× random face
          const face = Math.floor(Math.random() * 5) + 2; // 2-6, avoid Paco
          return executeBotAction(prev, { type: "bid", quantity: 1, faceValue: face });
        }
        if (bid.quantity >= 3) {
          return executeBotAction(prev, { type: "challenge" });
        }
        return executeBotAction(prev, {
          type: "bid",
          quantity: bid.quantity + 1,
          faceValue: bid.faceValue,
        });
      });
    }, 1500);
    timeoutsRef.current.push(timeout);

    return () => clearTimeout(timeout);
  }, [isFreePlay, fullState, executeBotAction]);

  return {
    gameState,
    currentStep,
    stepIndex,
    isComplete,
    isFreePlay,
    error,
    actions: {
      advanceStep,
      placeBid,
      callChallenge: callChallengeAction,
      nextRound,
      restart: initGame,
    },
  };
}

export { PLAYER_ID, BOT_ID };
