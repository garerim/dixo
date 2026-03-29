// =============================================================================
// Tournament Engine — Seeding
// =============================================================================
// Generates seeded bracket positions from participants sorted by ELO.
// Standard tournament seeding: 1v8, 4v5, 3v6, 2v7 (for 8 players).
// =============================================================================

import type { SeedEntry } from "./types";

/**
 * Sort participants by ELO descending and assign seeds (1 = highest ELO).
 */
export function assignSeeds(participants: SeedEntry[]): SeedEntry[] {
  return [...participants]
    .sort((a, b) => b.elo - a.elo)
    .map((entry, index) => ({ ...entry, elo: entry.elo }));
}

/**
 * Generate standard seeded bracket pairings for a power-of-2 bracket.
 * Returns pairs of seed indices for the first round.
 *
 * For 8 players: [[0,7], [3,4], [2,5], [1,6]]
 * This ensures seed 1 vs 8, seed 4 vs 5, etc.
 * And that seed 1 and seed 2 can only meet in the finals.
 */
export function generateBracketPairings(size: number): [number, number][] {
  if (size === 2) return [[0, 1]];

  const half = size / 2;
  const topHalf = generateBracketPairings(half);

  return topHalf.map(([a, b]) => [a, size - 1 - a] as [number, number]);
}

/**
 * Place participants into first-round matchups using standard seeding.
 * If there are fewer participants than maxParticipants, remaining slots
 * get byes (null player).
 */
export function seedParticipants(
  participants: SeedEntry[],
  maxParticipants: number,
): { player1Id: string | null; player2Id: string | null }[] {
  const sorted = assignSeeds(participants);
  const pairings = generateBracketPairings(maxParticipants);

  return pairings.map(([seedA, seedB]) => ({
    player1Id: sorted[seedA]?.userId ?? null,
    player2Id: sorted[seedB]?.userId ?? null,
  }));
}
