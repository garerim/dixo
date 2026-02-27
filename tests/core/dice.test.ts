// =============================================================================
// TESTS — Logique de lancer de dés
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  rollDie,
  rollDice,
  rollDiceForAllPlayers,
  countDiceWithFace,
  getTotalDiceInPlay,
} from "@/core/game-engine/dice";
import type { GameState, PlayerState } from "@/core/game-engine/types";
import { GamePhase, DEFAULT_GAME_CONFIG } from "@/core/game-engine/types";

// Générateur aléatoire déterministe pour les tests
function createDeterministicRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index++;
    return value;
  };
}

describe("rollDie", () => {
  it("retourne un dé entre 1 et 6", () => {
    for (let i = 0; i < 100; i++) {
      const result = rollDie();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it("utilise le générateur aléatoire injecté", () => {
    // Math.floor(0.0 * 6) + 1 = 1
    const random = createDeterministicRandom([0.0]);
    expect(rollDie(random)).toBe(1);

    // Math.floor(0.999 * 6) + 1 = 6
    const random2 = createDeterministicRandom([0.999]);
    expect(rollDie(random2)).toBe(6);
  });
});

describe("rollDice", () => {
  it("retourne le bon nombre de dés", () => {
    const result = rollDice(5);
    expect(result).toHaveLength(5);
  });

  it("retourne un tableau vide pour 0 dés", () => {
    expect(rollDice(0)).toEqual([]);
  });

  it("retourne des valeurs déterministes avec un random injecté", () => {
    // 0.0 → 1, 0.5 → 4, 0.999 → 6
    const random = createDeterministicRandom([0.0, 0.5, 0.999]);
    const result = rollDice(3, random);
    expect(result).toEqual([1, 4, 6]);
  });
});

describe("rollDiceForAllPlayers", () => {
  it("lance les dés pour les joueurs vivants uniquement", () => {
    const state: GameState = {
      id: "test",
      joinCode: "ABC123",
      config: DEFAULT_GAME_CONFIG,
      players: [
        createPlayer("p1", 3, [], true),
        createPlayer("p2", 2, [], true),
        createPlayer("p3", 0, [], false), // éliminé
      ],
      currentPlayerIndex: 0,
      phase: GamePhase.ROLLING,
      currentBid: null,
      round: 1,
      lastChallengeResult: null,
      winnerId: null,
      createdAt: "",
      updatedAt: "",
    };

    const result = rollDiceForAllPlayers(state);

    // P1 a 3 dés
    expect(result.players[0].diceValues).toHaveLength(3);
    // P2 a 2 dés
    expect(result.players[1].diceValues).toHaveLength(2);
    // P3 est mort, pas de dés
    expect(result.players[2].diceValues).toHaveLength(0);
  });

  it("ne modifie pas l'état d'entrée (immutabilité)", () => {
    const state: GameState = {
      id: "test",
      joinCode: "ABC123",
      config: DEFAULT_GAME_CONFIG,
      players: [createPlayer("p1", 5, [], true)],
      currentPlayerIndex: 0,
      phase: GamePhase.ROLLING,
      currentBid: null,
      round: 1,
      lastChallengeResult: null,
      winnerId: null,
      createdAt: "",
      updatedAt: "",
    };

    const result = rollDiceForAllPlayers(state);
    expect(result).not.toBe(state);
    expect(result.players).not.toBe(state.players);
    expect(state.players[0].diceValues).toEqual([]); // original inchangé
  });
});

describe("countDiceWithFace", () => {
  const players: PlayerState[] = [
    createPlayer("p1", 5, [1, 2, 3, 4, 5], true),
    createPlayer("p2", 5, [1, 1, 3, 3, 6], true),
    createPlayer("p3", 3, [2, 2, 5], true),
  ];

  it("compte correctement les dés d'une face donnée (sans jokers)", () => {
    // Face 3 : p1 a un 3, p2 a deux 3 = 3 total
    expect(countDiceWithFace(players, 3, false)).toBe(3);
  });

  it("ajoute les Pacos comme jokers quand activés", () => {
    // Face 3 : 3 dés de face 3 + 3 Pacos (1) = 6 total
    expect(countDiceWithFace(players, 3, true)).toBe(6);
  });

  it("ne compte pas les Pacos comme jokers quand on cherche les 1", () => {
    // Face 1 : p1 a un 1, p2 a deux 1 = 3 total (pas de joker)
    expect(countDiceWithFace(players, 1, true)).toBe(3);
  });

  it("ignore les joueurs éliminés", () => {
    const withDead = [
      ...players,
      createPlayer("p4", 0, [3, 3, 3], false), // éliminé
    ];
    expect(countDiceWithFace(withDead, 3, false)).toBe(3);
  });
});

describe("getTotalDiceInPlay", () => {
  it("retourne le total des dés des joueurs vivants", () => {
    const players: PlayerState[] = [
      createPlayer("p1", 5, [], true),
      createPlayer("p2", 3, [], true),
      createPlayer("p3", 0, [], false),
    ];
    expect(getTotalDiceInPlay(players)).toBe(8);
  });
});

// =============================================================================
// Helper
// =============================================================================

function createPlayer(
  id: string,
  diceCount: number,
  diceValues: number[],
  isAlive: boolean,
): PlayerState {
  return {
    id,
    displayName: `Player ${id}`,
    diceCount,
    diceValues,
    isAlive,
    isHost: false,
    seatIndex: 0,
  };
}
