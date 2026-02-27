// =============================================================================
// CORE DOMAIN — ELO & Matchmaking — Barrel Export
// =============================================================================

// Types
export type { EloPlayer, EloChange, EloConfig } from "./types";
export { DEFAULT_ELO_CONFIG } from "./types";

// Calculator
export {
  expectedScore,
  getKFactor,
  actualScore,
  calculateMultiplayerElo,
  calculateDuelElo,
  buildPlacements,
} from "./calculator";

// Matchmaking
export type { QueueEntry, MatchGroup, MatchmakingConfig } from "./matchmaking";
export {
  DEFAULT_MATCHMAKING_CONFIG,
  getAcceptableEloRange,
  arePlayersCompatible,
  findMatch,
  getAverageElo,
} from "./matchmaking";
