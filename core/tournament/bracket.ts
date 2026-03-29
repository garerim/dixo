// =============================================================================
// Tournament Engine — Bracket Logic
// =============================================================================
// Pure functions for creating and advancing single-elimination brackets.
// No database, no network — takes state in, returns state out.
// =============================================================================

import type {
  BracketState,
  BracketMatch,
  BracketActionResult,
  SeedEntry,
  MatchStatus,
} from "./types";
import { seedParticipants } from "./seeding";

// =============================================================================
// Create bracket
// =============================================================================

/**
 * Create a single-elimination bracket from a list of participants.
 */
export function createSingleEliminationBracket(
  participants: SeedEntry[],
  maxParticipants: 4 | 8 | 16 | 32,
): BracketState {
  const totalRounds = Math.log2(maxParticipants);
  const firstRoundPairings = seedParticipants(participants, maxParticipants);

  // Assign seeds map
  const sorted = [...participants].sort((a, b) => b.elo - a.elo);
  const seeds: Record<string, number> = {};
  sorted.forEach((p, i) => {
    seeds[p.userId] = i + 1;
  });

  // Create all matches for all rounds
  const matches: BracketMatch[] = [];

  // First round matches
  firstRoundPairings.forEach((pairing, index) => {
    const isBye = pairing.player1Id === null || pairing.player2Id === null;
    const byeWinner = isBye
      ? pairing.player1Id ?? pairing.player2Id
      : null;

    matches.push({
      round: 1,
      matchIndex: index,
      bracketSide: "winners",
      player1Id: pairing.player1Id,
      player2Id: pairing.player2Id,
      winnerId: byeWinner,
      gameId: null,
      status: isBye ? "bye" : "ready",
    });
  });

  // Future round matches (empty placeholders)
  for (let round = 2; round <= totalRounds; round++) {
    const matchCount = maxParticipants / Math.pow(2, round);
    for (let index = 0; index < matchCount; index++) {
      matches.push({
        round,
        matchIndex: index,
        bracketSide: "winners",
        player1Id: null,
        player2Id: null,
        winnerId: null,
        gameId: null,
        status: "pending",
      });
    }
  }

  // Propagate bye winners to round 2
  const bracket: BracketState = {
    format: "single_elimination",
    totalRounds,
    seeds,
    matches,
  };

  return propagateByes(bracket);
}

// =============================================================================
// Record match result
// =============================================================================

/**
 * Record the result of a completed match and advance the winner.
 * Returns the new bracket state plus any matches that became ready.
 */
export function recordMatchResult(
  bracket: BracketState,
  round: number,
  matchIndex: number,
  winnerId: string,
): BracketActionResult {
  const matchIdx = bracket.matches.findIndex(
    (m) => m.round === round && m.matchIndex === matchIndex && m.bracketSide === "winners",
  );

  if (matchIdx === -1) {
    return { success: false, bracket, error: "Match not found", newReadyMatches: [], isComplete: false, winnerId: null };
  }

  const match = bracket.matches[matchIdx];
  if (match.status === "completed" || match.status === "bye") {
    return { success: false, bracket, error: "Match already completed", newReadyMatches: [], isComplete: false, winnerId: null };
  }

  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    return { success: false, bracket, error: "Winner is not in this match", newReadyMatches: [], isComplete: false, winnerId: null };
  }

  // Update the match as completed
  const updatedMatches = [...bracket.matches];
  updatedMatches[matchIdx] = {
    ...match,
    winnerId,
    status: "completed" as MatchStatus,
  };

  // Advance winner to the next round
  if (round < bracket.totalRounds) {
    const nextRound = round + 1;
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const isFirstPlayer = matchIndex % 2 === 0;

    const nextMatchIdx = updatedMatches.findIndex(
      (m) => m.round === nextRound && m.matchIndex === nextMatchIndex && m.bracketSide === "winners",
    );

    if (nextMatchIdx !== -1) {
      const nextMatch = updatedMatches[nextMatchIdx];
      updatedMatches[nextMatchIdx] = {
        ...nextMatch,
        player1Id: isFirstPlayer ? winnerId : nextMatch.player1Id,
        player2Id: isFirstPlayer ? nextMatch.player2Id : winnerId,
        status: getMatchStatus(
          isFirstPlayer ? winnerId : nextMatch.player1Id,
          isFirstPlayer ? nextMatch.player2Id : winnerId,
        ),
      };
    }
  }

  const newBracket: BracketState = { ...bracket, matches: updatedMatches };

  // Check if tournament is complete (finals match has a winner)
  const finalsMatch = updatedMatches.find(
    (m) => m.round === bracket.totalRounds && m.bracketSide === "winners",
  );
  const isComplete = finalsMatch?.status === "completed";
  const tournamentWinner = isComplete ? finalsMatch!.winnerId : null;

  // Find newly ready matches
  const newReadyMatches = updatedMatches.filter(
    (m) =>
      m.status === "ready" &&
      !bracket.matches.some(
        (old) =>
          old.round === m.round &&
          old.matchIndex === m.matchIndex &&
          old.bracketSide === m.bracketSide &&
          old.status === "ready",
      ),
  );

  return {
    success: true,
    bracket: newBracket,
    newReadyMatches,
    isComplete,
    winnerId: tournamentWinner,
  };
}

// =============================================================================
// Queries
// =============================================================================

/** Get all matches that are ready to be played. */
export function getReadyMatches(bracket: BracketState): BracketMatch[] {
  return bracket.matches.filter((m) => m.status === "ready");
}

/** Get all completed matches. */
export function getCompletedMatches(bracket: BracketState): BracketMatch[] {
  return bracket.matches.filter((m) => m.status === "completed" || m.status === "bye");
}

/** Check if tournament bracket is complete. */
export function isBracketComplete(bracket: BracketState): boolean {
  const finals = bracket.matches.find(
    (m) => m.round === bracket.totalRounds && m.bracketSide === "winners",
  );
  return finals?.status === "completed";
}

/** Get the final placements from the bracket (1st, 2nd, semifinalists). */
export function getPlacements(bracket: BracketState): {
  winner: string | null;
  finalist: string | null;
  semifinalists: string[];
} {
  const finals = bracket.matches.find(
    (m) => m.round === bracket.totalRounds && m.bracketSide === "winners",
  );

  if (!finals || !finals.winnerId) {
    return { winner: null, finalist: null, semifinalists: [] };
  }

  const winner = finals.winnerId;
  const finalist =
    finals.player1Id === winner ? finals.player2Id : finals.player1Id;

  // Semifinalists = losers of the semifinal round
  const semiFinalRound = bracket.totalRounds - 1;
  if (semiFinalRound < 1) {
    return { winner, finalist, semifinalists: [] };
  }

  const semiMatches = bracket.matches.filter(
    (m) => m.round === semiFinalRound && m.bracketSide === "winners" && m.status === "completed",
  );
  const semifinalists = semiMatches
    .map((m) => (m.winnerId === m.player1Id ? m.player2Id : m.player1Id))
    .filter((id): id is string => id !== null);

  return { winner, finalist, semifinalists };
}

/** Set a game ID on a match (when the game is created). */
export function setMatchGameId(
  bracket: BracketState,
  round: number,
  matchIndex: number,
  gameId: string,
): BracketState {
  const matches = bracket.matches.map((m) => {
    if (m.round === round && m.matchIndex === matchIndex && m.bracketSide === "winners") {
      return { ...m, gameId, status: "in_progress" as MatchStatus };
    }
    return m;
  });
  return { ...bracket, matches };
}

// =============================================================================
// Helpers
// =============================================================================

function getMatchStatus(player1Id: string | null, player2Id: string | null): MatchStatus {
  if (player1Id && player2Id) return "ready";
  return "pending";
}

/**
 * Propagate bye winners from round 1 to round 2.
 * When a match is a bye, the present player advances automatically.
 */
function propagateByes(bracket: BracketState): BracketState {
  let matches = [...bracket.matches];

  const byeMatches = matches.filter((m) => m.round === 1 && m.status === "bye");

  for (const bye of byeMatches) {
    if (!bye.winnerId) continue;

    const nextRound = 2;
    const nextMatchIndex = Math.floor(bye.matchIndex / 2);
    const isFirstPlayer = bye.matchIndex % 2 === 0;

    const nextIdx = matches.findIndex(
      (m) => m.round === nextRound && m.matchIndex === nextMatchIndex && m.bracketSide === "winners",
    );

    if (nextIdx !== -1) {
      const nextMatch = matches[nextIdx];
      matches[nextIdx] = {
        ...nextMatch,
        player1Id: isFirstPlayer ? bye.winnerId : nextMatch.player1Id,
        player2Id: isFirstPlayer ? nextMatch.player2Id : bye.winnerId,
        status: getMatchStatus(
          isFirstPlayer ? bye.winnerId : nextMatch.player1Id,
          isFirstPlayer ? nextMatch.player2Id : bye.winnerId,
        ),
      };
    }
  }

  return { ...bracket, matches };
}
