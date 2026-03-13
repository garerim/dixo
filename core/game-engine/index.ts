// =============================================================================
// CORE DOMAIN — Barrel Export
// =============================================================================
// Point d'entrée unique pour tout le game engine.
// Les couches supérieures importent uniquement depuis ce fichier.
// =============================================================================

// Types
export type {
  Bid,
  PlayerState,
  GameState,
  ChallengeResult,
  GameConfig,
  GameActionResult,
} from "./types";
export { GamePhase, GameMode, GameEvent, DEFAULT_GAME_CONFIG } from "./types";

// Dice
export {
  rollDie,
  rollDice,
  rollDiceForAllPlayers,
  countDiceWithFace,
  getTotalDiceInPlay,
} from "./dice";
export type { RandomGenerator } from "./dice";

// Bid Validator
export {
  validateBid,
  canCallChallenge,
  isBidHigherThan,
  isValidFaceValue,
  isValidQuantity,
} from "./bid-validator";
export type { BidValidationResult } from "./bid-validator";

// Challenge Resolver
export {
  resolveChallenge,
  applyChallengePenalty,
  getAlivePlayers,
  getWinner,
} from "./challenge-resolver";

// Turn Manager
export {
  getNextAlivePlayerIndex,
  advanceToNextPlayer,
  getStartingPlayerIndex,
  isPlayerTurn,
  getCurrentPlayer,
  getPlayerIndex,
} from "./turn-manager";

// State Machine (point d'entrée principal)
export {
  createInitialGameState,
  generateJoinCode,
  addPlayer,
  removePlayer,
  updateSettings,
  startGame,
  placeBid,
  callChallenge,
  startNextRound,
  surrender,
} from "./state-machine";
