// =============================================================================
// TESTS — Calculateur ELO
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  expectedScore,
  getKFactor,
  actualScore,
  calculateMultiplayerElo,
  calculateDuelElo,
  buildPlacements,
} from "@/core/elo/calculator";
import { DEFAULT_ELO_CONFIG } from "@/core/elo/types";

describe("expectedScore", () => {
  it("devrait retourner 0.5 pour deux joueurs au même ELO", () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 4);
  });

  it("devrait retourner > 0.5 pour un joueur avec un ELO plus élevé", () => {
    const result = expectedScore(1200, 1000);
    expect(result).toBeGreaterThan(0.5);
    expect(result).toBeCloseTo(0.7597, 3);
  });

  it("devrait retourner < 0.5 pour un joueur avec un ELO plus bas", () => {
    const result = expectedScore(1000, 1200);
    expect(result).toBeLessThan(0.5);
    expect(result).toBeCloseTo(0.2403, 3);
  });

  it("la somme des probabilités devrait être ~1", () => {
    const eA = expectedScore(1500, 1200);
    const eB = expectedScore(1200, 1500);
    expect(eA + eB).toBeCloseTo(1, 4);
  });
});

describe("getKFactor", () => {
  it("devrait retourner 40 pour un nouveau joueur", () => {
    expect(getKFactor(1000, 10)).toBe(40);
  });

  it("devrait retourner 20 pour un joueur standard", () => {
    expect(getKFactor(1500, 50)).toBe(20);
  });

  it("devrait retourner 10 pour un joueur haut classement", () => {
    expect(getKFactor(2100, 100)).toBe(10);
  });

  it("devrait utiliser le seuil de parties pour 'nouveau'", () => {
    expect(getKFactor(1000, 29)).toBe(40); // < 30
    expect(getKFactor(1000, 30)).toBe(20); // >= 30
  });
});

describe("actualScore", () => {
  it("devrait retourner 1 si A est mieux classé", () => {
    expect(actualScore(1, 2)).toBe(1);
  });

  it("devrait retourner 0 si A est moins bien classé", () => {
    expect(actualScore(3, 1)).toBe(0);
  });

  it("devrait retourner 0.5 en cas d'égalité", () => {
    expect(actualScore(2, 2)).toBe(0.5);
  });
});

describe("calculateDuelElo", () => {
  it("devrait augmenter l'ELO du gagnant et diminuer celui du perdant", () => {
    const result = calculateDuelElo(
      { id: "winner", elo: 1000, gamesPlayed: 50 },
      { id: "loser", elo: 1000, gamesPlayed: 50 },
    );

    expect(result.winner.delta).toBeGreaterThan(0);
    expect(result.loser.delta).toBeLessThan(0);
    expect(result.winner.newElo).toBe(1000 + result.winner.delta);
    expect(result.loser.newElo).toBe(1000 + result.loser.delta);
  });

  it("devrait donner plus de points pour une upset", () => {
    // Joueur faible bat joueur fort
    const upset = calculateDuelElo(
      { id: "w", elo: 800, gamesPlayed: 50 },
      { id: "l", elo: 1200, gamesPlayed: 50 },
    );

    // Joueur fort bat joueur faible
    const expected = calculateDuelElo(
      { id: "w", elo: 1200, gamesPlayed: 50 },
      { id: "l", elo: 800, gamesPlayed: 50 },
    );

    // L'upset donne plus de points au gagnant
    expect(upset.winner.delta).toBeGreaterThan(expected.winner.delta);
  });

  it("devrait respecter les limites ELO", () => {
    const result = calculateDuelElo(
      { id: "w", elo: 2990, gamesPlayed: 50 },
      { id: "l", elo: 110, gamesPlayed: 50 },
    );

    expect(result.winner.newElo).toBeLessThanOrEqual(DEFAULT_ELO_CONFIG.maxElo);
    expect(result.loser.newElo).toBeGreaterThanOrEqual(DEFAULT_ELO_CONFIG.minElo);
  });
});

describe("calculateMultiplayerElo", () => {
  it("devrait retourner des deltas vides pour moins de 2 joueurs", () => {
    const changes = calculateMultiplayerElo(
      [{ id: "solo", elo: 1000, placement: 1 }],
      new Map([["solo", 50]]),
    );

    expect(changes).toHaveLength(1);
    expect(changes[0].delta).toBe(0);
  });

  it("devrait calculer correctement pour 3 joueurs", () => {
    const players = [
      { id: "p1", elo: 1000, placement: 1 },
      { id: "p2", elo: 1000, placement: 2 },
      { id: "p3", elo: 1000, placement: 3 },
    ];

    const gamesPlayed = new Map([
      ["p1", 50],
      ["p2", 50],
      ["p3", 50],
    ]);

    const changes = calculateMultiplayerElo(players, gamesPlayed);

    expect(changes).toHaveLength(3);

    const p1 = changes.find((c) => c.playerId === "p1")!;
    const p3 = changes.find((c) => c.playerId === "p3")!;

    // Le 1er gagne des points
    expect(p1.delta).toBeGreaterThan(0);
    // Le dernier perd des points
    expect(p3.delta).toBeLessThan(0);
  });

  it("devrait donner un K-factor plus élevé aux nouveaux joueurs", () => {
    const players = [
      { id: "new", elo: 1000, placement: 1 },
      { id: "vet", elo: 1000, placement: 2 },
    ];

    const gamesPlayedNew = new Map([
      ["new", 5],  // nouveau
      ["vet", 100], // vétéran
    ]);

    const changes = calculateMultiplayerElo(players, gamesPlayedNew);

    const newPlayer = changes.find((c) => c.playerId === "new")!;
    const vetPlayer = changes.find((c) => c.playerId === "vet")!;

    // Le nouveau joueur devrait gagner plus de points
    expect(Math.abs(newPlayer.delta)).toBeGreaterThan(Math.abs(vetPlayer.delta));
  });
});

describe("buildPlacements", () => {
  it("devrait construire les placements correctement", () => {
    const placements = buildPlacements(["p3", "p2"], "p1");

    expect(placements.get("p1")).toBe(1); // Gagnant
    expect(placements.get("p2")).toBe(2); // Dernier éliminé = 2ème
    expect(placements.get("p3")).toBe(3); // Premier éliminé = dernier
  });

  it("devrait gérer un duel (2 joueurs)", () => {
    const placements = buildPlacements(["loser"], "winner");

    expect(placements.get("winner")).toBe(1);
    expect(placements.get("loser")).toBe(2);
  });
});
