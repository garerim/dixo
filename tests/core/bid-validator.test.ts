// =============================================================================
// TESTS — Validation des enchères
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  isValidFaceValue,
  isValidQuantity,
  isBidHigherThan,
  validateBid,
  canCallChallenge,
} from "@/core/game-engine/bid-validator";
import type { Bid, GameState, PlayerState } from "@/core/game-engine/types";
import { GamePhase, GameMode, DEFAULT_GAME_CONFIG } from "@/core/game-engine/types";

describe("isValidFaceValue", () => {
  it("accepte les faces 1-6", () => {
    for (let i = 1; i <= 6; i++) {
      expect(isValidFaceValue(i)).toBe(true);
    }
  });

  it("refuse les faces invalides", () => {
    expect(isValidFaceValue(0)).toBe(false);
    expect(isValidFaceValue(7)).toBe(false);
    expect(isValidFaceValue(-1)).toBe(false);
    expect(isValidFaceValue(1.5)).toBe(false);
  });
});

describe("isValidQuantity", () => {
  it("accepte les quantités >= 1", () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(10)).toBe(true);
  });

  it("refuse les quantités invalides", () => {
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
  });
});

describe("isBidHigherThan", () => {
  it("accepte une quantité supérieure avec même face", () => {
    const current: Bid = { playerId: "p1", quantity: 3, faceValue: 4 };
    const next: Bid = { playerId: "p2", quantity: 4, faceValue: 4 };
    expect(isBidHigherThan(next, current)).toBe(true);
  });

  it("accepte une face supérieure avec même quantité", () => {
    const current: Bid = { playerId: "p1", quantity: 3, faceValue: 3 };
    const next: Bid = { playerId: "p2", quantity: 3, faceValue: 5 };
    expect(isBidHigherThan(next, current)).toBe(true);
  });

  it("refuse une enchère identique", () => {
    const current: Bid = { playerId: "p1", quantity: 3, faceValue: 4 };
    const next: Bid = { playerId: "p2", quantity: 3, faceValue: 4 };
    expect(isBidHigherThan(next, current)).toBe(false);
  });

  it("refuse une enchère inférieure", () => {
    const current: Bid = { playerId: "p1", quantity: 3, faceValue: 4 };
    const next: Bid = { playerId: "p2", quantity: 2, faceValue: 4 };
    expect(isBidHigherThan(next, current)).toBe(false);
  });

  it("gère la transition vers les Pacos (face 1)", () => {
    // Enchère actuelle : 4 dés de face 5
    // Pour passer aux Pacos : ceil(4/2) = 2 minimum
    const current: Bid = { playerId: "p1", quantity: 4, faceValue: 5 };
    const validPaco: Bid = { playerId: "p2", quantity: 2, faceValue: 1 };
    const invalidPaco: Bid = { playerId: "p2", quantity: 1, faceValue: 1 };

    expect(isBidHigherThan(validPaco, current, true)).toBe(true);
    expect(isBidHigherThan(invalidPaco, current, true)).toBe(false);
  });

  it("gère la transition depuis les Pacos (face 1)", () => {
    // Enchère actuelle : 2 Pacos
    // Pour quitter les Pacos : 2*2+1 = 5 minimum
    const current: Bid = { playerId: "p1", quantity: 2, faceValue: 1 };
    const valid: Bid = { playerId: "p2", quantity: 5, faceValue: 3 };
    const invalid: Bid = { playerId: "p2", quantity: 4, faceValue: 3 };

    expect(isBidHigherThan(valid, current, true)).toBe(true);
    expect(isBidHigherThan(invalid, current, true)).toBe(false);
  });
});

describe("validateBid", () => {
  it("refuse une enchère hors phase BIDDING", () => {
    const state = createGameState(GamePhase.LOBBY);
    const bid: Bid = { playerId: "p1", quantity: 1, faceValue: 3 };
    const result = validateBid(state, bid);
    expect(result.isValid).toBe(false);
  });

  it("refuse si ce n'est pas le tour du joueur", () => {
    const state = createGameState(GamePhase.BIDDING, 0); // tour de p1
    const bid: Bid = { playerId: "p2", quantity: 1, faceValue: 3 };
    const result = validateBid(state, bid);
    expect(result.isValid).toBe(false);
  });

  it("accepte une enchère valide sans enchère précédente", () => {
    const state = createGameState(GamePhase.BIDDING);
    const bid: Bid = { playerId: "p1", quantity: 2, faceValue: 4 };
    const result = validateBid(state, bid);
    expect(result.isValid).toBe(true);
  });

  it("accepte une enchère supérieure à la précédente", () => {
    const state = createGameState(GamePhase.BIDDING, 1, {
      playerId: "p1",
      quantity: 2,
      faceValue: 3,
    });
    const bid: Bid = { playerId: "p2", quantity: 3, faceValue: 3 };
    const result = validateBid(state, bid);
    expect(result.isValid).toBe(true);
  });

  it("refuse une enchère dépassant le total de dés", () => {
    const state = createGameState(GamePhase.BIDDING); // 10 dés total
    const bid: Bid = { playerId: "p1", quantity: 11, faceValue: 3 };
    const result = validateBid(state, bid);
    expect(result.isValid).toBe(false);
  });
});

describe("canCallChallenge", () => {
  it("refuse le Challenge sans enchère précédente", () => {
    const state = createGameState(GamePhase.BIDDING);
    const result = canCallChallenge(state, "p1");
    expect(result.isValid).toBe(false);
  });

  it("refuse le Challenge sur sa propre enchère", () => {
    const state = createGameState(GamePhase.BIDDING, 0, {
      playerId: "p1",
      quantity: 2,
      faceValue: 3,
    });
    const result = canCallChallenge(state, "p1");
    expect(result.isValid).toBe(false);
  });

  it("accepte un Challenge valide", () => {
    const state = createGameState(GamePhase.BIDDING, 1, {
      playerId: "p1",
      quantity: 2,
      faceValue: 3,
    });
    const result = canCallChallenge(state, "p2");
    expect(result.isValid).toBe(true);
  });
});

// =============================================================================
// Helpers
// =============================================================================

function createPlayer(id: string, seatIndex: number): PlayerState {
  return {
    id,
    displayName: `Player ${id}`,
    diceCount: 5,
    diceValues: [1, 2, 3, 4, 5],
    isAlive: true,
    isHost: seatIndex === 0,
    seatIndex,
  };
}

function createGameState(
  phase: GamePhase,
  currentPlayerIndex: number = 0,
  currentBid: Bid | null = null,
): GameState {
  return {
    id: "test-game",
    joinCode: "ABC123",
    gameMode: GameMode.PRIVATE,
    config: DEFAULT_GAME_CONFIG,
    players: [createPlayer("p1", 0), createPlayer("p2", 1)],
    currentPlayerIndex,
    phase,
    currentBid,
    round: 1,
    lastChallengeResult: null,
    winnerId: null,
    createdAt: "",
    updatedAt: "",
  };
}
