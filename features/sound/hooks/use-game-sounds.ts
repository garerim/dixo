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

    // ── Challenge called ──
    if (prev.phase !== "CHALLENGE" && gameState.phase === "CHALLENGE") {
      playSound("challenge");
      return;
    }

    // ── Result phase → win or loss ──
    if (prev.phase !== "RESULT" && gameState.phase === "RESULT") {
      if (gameState.lastChallengeResult) {
        playSound(
          gameState.lastChallengeResult.loserId === playerId
            ? "round-loss"
            : "round-win",
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

    // ── New bid placed by someone else ──
    if (
      gameState.currentBid &&
      gameState.phase === "BIDDING" &&
      prev.currentBid !== gameState.currentBid
    ) {
      // Check if it's a different bid (by comparing values since objects are new each time)
      const prevBid = prev.currentBid;
      const currBid = gameState.currentBid;
      if (
        !prevBid ||
        prevBid.quantity !== currBid.quantity ||
        prevBid.faceValue !== currBid.faceValue
      ) {
        playSound("bid-place");
      }
    }

    // ── My turn notification ──
    if (
      gameState.phase === "BIDDING" &&
      prev.currentPlayerIndex !== gameState.currentPlayerIndex &&
      gameState.players[gameState.currentPlayerIndex]?.id === playerId
    ) {
      playSound("your-turn");
    }
  }, [gameState, playerId, playSound]);
}
