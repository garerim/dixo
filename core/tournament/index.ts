// =============================================================================
// Tournament Engine — Public API
// =============================================================================

export type {
  TournamentFormat,
  TournamentStatus,
  MatchStatus,
  BracketSide,
  BracketMatch,
  BracketState,
  TournamentConfig,
  SeedEntry,
  BracketActionResult,
} from "./types";

export {
  createSingleEliminationBracket,
  recordMatchResult,
  getReadyMatches,
  getCompletedMatches,
  isBracketComplete,
  getPlacements,
  setMatchGameId,
} from "./bracket";

export { assignSeeds, seedParticipants, generateBracketPairings } from "./seeding";
