// =============================================================================
// TESTS — Logique de matchmaking
// =============================================================================

import { describe, it, expect } from "vitest";
import {
  getAcceptableEloRange,
  arePlayersCompatible,
  findMatch,
  getAverageElo,
  type QueueEntry,
  DEFAULT_MATCHMAKING_CONFIG,
} from "@/core/elo/matchmaking";

describe("getAcceptableEloRange", () => {
  it("devrait retourner le range initial à t=0", () => {
    expect(getAcceptableEloRange(0)).toBe(100);
  });

  it("devrait élargir le range avec le temps", () => {
    // 10 secondes → 100 + 10*5 = 150
    expect(getAcceptableEloRange(10)).toBe(150);
  });

  it("devrait ne pas dépasser le max", () => {
    expect(getAcceptableEloRange(1000)).toBe(500);
  });
});

describe("arePlayersCompatible", () => {
  const now = new Date("2026-01-01T12:00:30Z");

  it("devrait être compatible si écart ELO < range", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      joinedAt: "2026-01-01T12:00:00Z", // 30s d'attente → range 250
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1200,
      joinedAt: "2026-01-01T12:00:20Z", // 10s d'attente → range 150
    };

    expect(arePlayersCompatible(a, b, now)).toBe(true);
  });

  it("devrait être incompatible si écart ELO > range", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      joinedAt: "2026-01-01T12:00:25Z", // 5s → range 125
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1500,
      joinedAt: "2026-01-01T12:00:25Z", // 5s → range 125
    };

    expect(arePlayersCompatible(a, b, now)).toBe(false);
  });

  it("devrait utiliser le range le plus large des deux", () => {
    const a: QueueEntry = {
      userId: "a",
      elo: 1000,
      joinedAt: "2026-01-01T11:59:30Z", // 60s → range 400
    };
    const b: QueueEntry = {
      userId: "b",
      elo: 1350,
      joinedAt: "2026-01-01T12:00:29Z", // 1s → range 105
    };

    // Range A = 400, diff = 350 → compatible grâce au range de A
    expect(arePlayersCompatible(a, b, now)).toBe(true);
  });
});

describe("findMatch", () => {
  const now = new Date("2026-01-01T12:01:00Z");

  it("devrait retourner null si pas assez de joueurs", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, joinedAt: "2026-01-01T12:00:00Z" },
    ];

    expect(findMatch(queue, now)).toBeNull();
  });

  it("devrait trouver un match entre 2 joueurs compatibles", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 1000, joinedAt: "2026-01-01T12:00:00Z" },
      { userId: "b", elo: 1050, joinedAt: "2026-01-01T12:00:10Z" },
    ];

    const match = findMatch(queue, now);
    expect(match).not.toBeNull();
    expect(match!.players).toHaveLength(2);
  });

  it("devrait matcher les joueurs les plus proches en ELO", () => {
    const queue: QueueEntry[] = [
      { userId: "low", elo: 800, joinedAt: "2026-01-01T12:00:50Z" },
      { userId: "mid", elo: 1000, joinedAt: "2026-01-01T12:00:50Z" },
      { userId: "high", elo: 1900, joinedAt: "2026-01-01T12:00:50Z" },
    ];

    const match = findMatch(queue, now);

    // Avec seulement 10s d'attente, range = 150
    // low (800) + mid (1000) = diff 200 → trop
    // mid (1000) + high (1900) = diff 900 → trop
    // Aucun match possible
    expect(match).toBeNull();
  });

  it("devrait retourner null si aucun joueur compatible", () => {
    const queue: QueueEntry[] = [
      { userId: "a", elo: 500, joinedAt: "2026-01-01T12:00:55Z" },
      { userId: "b", elo: 2000, joinedAt: "2026-01-01T12:00:55Z" },
    ];

    // 5s d'attente → range = 125, diff = 1500 → pas compatible
    expect(findMatch(queue, now)).toBeNull();
  });
});

describe("getAverageElo", () => {
  it("devrait calculer la moyenne correctement", () => {
    const entries: QueueEntry[] = [
      { userId: "a", elo: 1000, joinedAt: "" },
      { userId: "b", elo: 1200, joinedAt: "" },
      { userId: "c", elo: 800, joinedAt: "" },
    ];

    expect(getAverageElo(entries)).toBe(1000);
  });

  it("devrait retourner 0 pour une liste vide", () => {
    expect(getAverageElo([])).toBe(0);
  });
});
