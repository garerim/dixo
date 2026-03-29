"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/components/providers/sound-provider";
import type { PublicGameState } from "@/types/api";

/**
 * Watches game state changes and triggers appropriate sound effects.
 * Should be called once in the game page component.
 */
export function useGameSounds(
  gameState: PublicGameState | null,
  playerId: string,
) {
  const { playSound } = useSound();
  const prevRef = useRef<PublicGameState | null>(null);

  useEffect(() => {
    if (!gameState) {
      prevRef.current = null;
      return;
    }

    const prev = prevRef.current;
    prevRef.current = gameState;

    // Skip first render (no previous state to compare)
    if (!prev) return;

    // ── New round started (dice roll) ──
    if (prev.round !== gameState.round && gameState.phase === "BIDDING") {
      playSound("dice-roll");
      return; // Don't stack sounds
    }

    // ── Result phase → win or loss ──
    if (prev.phase !== "RESULT" && gameState.phase === "RESULT") {
      if (gameState.lastChallengeResult) {
        // Pick a random round-win variant for variety
        const winSounds = ["round-win", "round-win2", "round-win3"] as const;
        const randomWin =
          winSounds[Math.floor(Math.random() * winSounds.length)];
        playSound(
          gameState.lastChallengeResult.loserId === playerId
            ? "game-defeat"
            : randomWin,
        );
      }
      return;
    }

    // ── Game over ──
    if (prev.phase !== "GAME_OVER" && gameState.phase === "GAME_OVER") {
      playSound(
        gameState.winnerId === playerId ? "game-victory" : "game-defeat",
      );
      return;
    }

    // ── Player count changed (join/leave) ──
    if (gameState.phase === "LOBBY" && prev.players && gameState.players) {
      if (gameState.players.length > prev.players.length) {
        playSound("player-join");
      } else if (gameState.players.length < prev.players.length) {
        playSound("player-leave");
      }
    }
  }, [gameState, playerId, playSound]);
}
