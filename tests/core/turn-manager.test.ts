// =============================================================================
// TESTS — Gestion des tours
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  getNextAlivePlayerIndex,
  advanceToNextPlayer,
  getStartingPlayerIndex,
  isPlayerTurn,
  getCurrentPlayer,
  getPlayerIndex,
} from "@/core/game-engine/turn-manager";
import type { GameState, PlayerState } from "@/core/game-engine/types";
import { GamePhase, GameMode, DEFAULT_GAME_CONFIG } from "@/core/game-engine/types";

describe("getNextAlivePlayerIndex", () => {
  it("retourne le joueur suivant vivant", () => {
    const players = [alive("p1"), alive("p2"), alive("p3")];
    expect(getNextAlivePlayerIndex(players, 0)).toBe(1);
    expect(getNextAlivePlayerIndex(players, 1)).toBe(2);
    expect(getNextAlivePlayerIndex(players, 2)).toBe(0); // boucle
  });

  it("saute les joueurs éliminés", () => {
    const players = [alive("p1"), dead("p2"), alive("p3")];
    expect(getNextAlivePlayerIndex(players, 0)).toBe(2);
  });

  it("retourne -1 si aucun joueur vivant", () => {
    const players = [dead("p1"), dead("p2")];
    expect(getNextAlivePlayerIndex(players, 0)).toBe(-1);
  });

  it("fonctionne avec un seul joueur vivant", () => {
    const players = [dead("p1"), alive("p2"), dead("p3")];
    expect(getNextAlivePlayerIndex(players, 1)).toBe(1); // retourne à lui-même
  });
});

describe("advanceToNextPlayer", () => {
  it("avance au joueur suivant", () => {
    const state = createState([alive("p1"), alive("p2"), alive("p3")], 0);
    const result = advanceToNextPlayer(state);
    expect(result.currentPlayerIndex).toBe(1);
  });
});

describe("getStartingPlayerIndex", () => {
  it("retourne le perdant s'il est encore vivant", () => {
    const players = [alive("p1"), alive("p2"), alive("p3")];
    expect(getStartingPlayerIndex(players, 1)).toBe(1);
  });

  it("retourne le suivant si le perdant est éliminé", () => {
    const players = [alive("p1"), dead("p2"), alive("p3")];
    expect(getStartingPlayerIndex(players, 1)).toBe(2);
  });
});

describe("isPlayerTurn", () => {
  it("retourne true si c'est le tour du joueur", () => {
    const state = createState([alive("p1"), alive("p2")], 0);
    expect(isPlayerTurn(state, "p1")).toBe(true);
    expect(isPlayerTurn(state, "p2")).toBe(false);
  });
});

describe("getCurrentPlayer", () => {
  it("retourne le joueur courant", () => {
    const state = createState([alive("p1"), alive("p2")], 1);
    const current = getCurrentPlayer(state);
    expect(current?.id).toBe("p2");
  });
});

describe("getPlayerIndex", () => {
  it("retourne l'index du joueur", () => {
    const players = [alive("p1"), alive("p2"), alive("p3")];
    expect(getPlayerIndex(players, "p2")).toBe(1);
  });

  it("retourne -1 si non trouvé", () => {
    const players = [alive("p1")];
    expect(getPlayerIndex(players, "unknown")).toBe(-1);
  });
});

// =============================================================================
// Helpers
// =============================================================================

function alive(id: string): PlayerState {
  return {
    id,
    displayName: `Player ${id}`,
    diceCount: 5,
    diceValues: [],
    isAlive: true,
    isHost: false,
    seatIndex: 0,
  };
}

function dead(id: string): PlayerState {
  return {
    id,
    displayName: `Player ${id}`,
    diceCount: 0,
    diceValues: [],
    isAlive: false,
    isHost: false,
    seatIndex: 0,
  };
}

function createState(
  players: PlayerState[],
  currentPlayerIndex: number,
): GameState {
  return {
    id: "test",
    joinCode: "ABC123",
    gameMode: GameMode.PRIVATE,
    config: DEFAULT_GAME_CONFIG,
    players,
    currentPlayerIndex,
    phase: GamePhase.BIDDING,
    currentBid: null,
    round: 1,
    lastChallengeResult: null,
    winnerId: null,
    createdAt: "",
    updatedAt: "",
  };
}
