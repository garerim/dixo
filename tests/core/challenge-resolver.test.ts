// =============================================================================
// TESTS — Résolution du Challenge (contestation d'enchère)
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  resolveChallenge,
  applyChallengePenalty,
  getAlivePlayers,
  getWinner,
} from "@/core/game-engine/challenge-resolver";
import type { GameState, PlayerState } from "@/core/game-engine/types";
import { GamePhase, GameMode, DEFAULT_GAME_CONFIG } from "@/core/game-engine/types";

describe("resolveChallenge", () => {
  it("Challenge correct : l'enchère était un bluff", () => {
    // P1 enchérit 4 dés de face 3, mais il n'y en a que 2
    const state = createChallengeState(
      [
        createPlayer("p1", [1, 2, 3, 4, 5]),
        createPlayer("p2", [2, 2, 5, 6, 6]),
      ],
      { playerId: "p1", quantity: 4, faceValue: 3 },
    );

    const result = resolveChallenge(state, "p2");

    // Face 3 : p1 a un 3, pacos (1) : p1 a un 1 → total = 2
    // 2 < 4 → Challenge correct !
    expect(result.isChallengeCorrect).toBe(true);
    expect(result.loserId).toBe("p1"); // Le bluffeur perd
    expect(result.actualCount).toBe(2);
  });

  it("Challenge incorrect : l'enchère était valide", () => {
    // P1 enchérit 3 dés de face 5, et il y en a bien 3
    const state = createChallengeState(
      [
        createPlayer("p1", [5, 5, 3, 4, 1]),
        createPlayer("p2", [5, 2, 3, 6, 6]),
      ],
      { playerId: "p1", quantity: 3, faceValue: 5 },
    );

    const result = resolveChallenge(state, "p2");

    // Face 5 : p1 a deux 5, p2 a un 5, pacos : p1 a un 1 → total = 4
    // 4 >= 3 → Challenge incorrect
    expect(result.isChallengeCorrect).toBe(false);
    expect(result.loserId).toBe("p2"); // Le caller perd
    expect(result.actualCount).toBe(4);
  });
});

describe("applyChallengePenalty", () => {
  it("retire un dé au perdant", () => {
    const players: PlayerState[] = [
      createPlayer("p1", [1, 2, 3, 4, 5]),
      createPlayer("p2", [1, 2, 3, 4, 5]),
    ];

    const result = applyChallengePenalty(players, "p1");

    expect(result[0].diceCount).toBe(4);
    expect(result[0].isAlive).toBe(true);
    expect(result[1].diceCount).toBe(5); // inchangé
  });

  it("élimine le joueur s'il n'a plus de dés", () => {
    const players: PlayerState[] = [
      { ...createPlayer("p1", [3]), diceCount: 1 },
      createPlayer("p2", [1, 2, 3, 4, 5]),
    ];

    const result = applyChallengePenalty(players, "p1");

    expect(result[0].diceCount).toBe(0);
    expect(result[0].isAlive).toBe(false);
  });

  it("ne modifie pas les autres joueurs", () => {
    const players: PlayerState[] = [
      createPlayer("p1", [1, 2, 3, 4, 5]),
      createPlayer("p2", [1, 2, 3, 4, 5]),
    ];

    const result = applyChallengePenalty(players, "p1");

    expect(result[1]).toEqual(players[1]); // identique
  });
});

describe("getAlivePlayers", () => {
  it("retourne uniquement les joueurs vivants", () => {
    const players: PlayerState[] = [
      createPlayer("p1", [1, 2, 3]),
      { ...createPlayer("p2", []), diceCount: 0, isAlive: false },
      createPlayer("p3", [4, 5]),
    ];

    const alive = getAlivePlayers(players);
    expect(alive).toHaveLength(2);
    expect(alive.map((p) => p.id)).toEqual(["p1", "p3"]);
  });
});

describe("getWinner", () => {
  it("retourne le gagnant quand il ne reste qu'un joueur", () => {
    const players: PlayerState[] = [
      { ...createPlayer("p1", []), diceCount: 0, isAlive: false },
      createPlayer("p2", [1, 2, 3]),
    ];

    const winner = getWinner(players);
    expect(winner).not.toBeNull();
    expect(winner!.id).toBe("p2");
  });

  it("retourne null s'il reste plusieurs joueurs", () => {
    const players: PlayerState[] = [
      createPlayer("p1", [1, 2, 3]),
      createPlayer("p2", [4, 5]),
    ];

    expect(getWinner(players)).toBeNull();
  });
});

// =============================================================================
// Helpers
// =============================================================================

function createPlayer(id: string, diceValues: number[]): PlayerState {
  return {
    id,
    displayName: `Player ${id}`,
    diceCount: diceValues.length,
    diceValues,
    isAlive: true,
    isHost: false,
    seatIndex: 0,
  };
}

function createChallengeState(
  players: PlayerState[],
  currentBid: { playerId: string; quantity: number; faceValue: number },
): GameState {
  return {
    id: "test-game",
    joinCode: "ABC123",
    gameMode: GameMode.PRIVATE,
    config: DEFAULT_GAME_CONFIG,
    players,
    currentPlayerIndex: 1,
    phase: GamePhase.BIDDING,
    currentBid,
    round: 1,
    lastChallengeResult: null,
    winnerId: null,
    createdAt: "",
    updatedAt: "",
  };
}
