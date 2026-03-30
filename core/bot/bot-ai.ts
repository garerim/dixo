// =============================================================================
// CORE — Bot AI decision engine
// =============================================================================
// Pure logic — no external dependencies except game-engine types.
// Given a GameState + botId + difficulty, returns the bot's action.
// =============================================================================

import type { GameState, Bid } from "../game-engine/types";
import { getTotalDiceInPlay } from "../game-engine/dice";
import { isBidHigherThan } from "../game-engine/bid-validator";
import type { BotDifficulty } from "./bot-profiles";

// =============================================================================
// Types
// =============================================================================

export type BotAction =
  | { type: "bid"; quantity: number; faceValue: number }
  | { type: "challenge" };

// =============================================================================
// Public API
// =============================================================================

/**
 * Compute the bot's next action based on game state and difficulty.
 *
 * @param state - Full game state (bot has access to its own dice)
 * @param botId - The bot's player ID
 * @param difficulty - AI difficulty level
 * @returns The action the bot should take
 */
export function computeBotAction(
  state: GameState,
  botId: string,
  difficulty: BotDifficulty,
): BotAction {
  switch (difficulty) {
    case "easy":
      return computeEasyAction(state, botId);
    case "medium":
      return computeMediumAction(state, botId);
    case "hard":
      return computeHardAction(state, botId);
  }
}

// =============================================================================
// Helpers — shared utilities
// =============================================================================

/** Get the bot's own dice values */
function getOwnDice(state: GameState, botId: string): readonly number[] {
  const bot = state.players.find((p) => p.id === botId);
  return bot?.diceValues ?? [];
}

/** Count how many of a given face the bot has (including pacos as wilds) */
function countOwnFace(
  ownDice: readonly number[],
  face: number,
  pacosAreWild: boolean,
): number {
  let count = 0;
  for (const die of ownDice) {
    if (die === face) count++;
    else if (pacosAreWild && face !== 1 && die === 1) count++;
  }
  return count;
}

/** Estimate how many of a face exist among OTHER players' unknown dice */
function estimateOthers(
  totalDice: number,
  ownDiceCount: number,
  face: number,
  pacosAreWild: boolean,
): number {
  const otherDice = totalDice - ownDiceCount;
  if (otherDice <= 0) return 0;

  // Probability of a single die matching
  if (face === 1 || !pacosAreWild) {
    // Only exact match: 1/6
    return otherDice / 6;
  }
  // Face + paco wilds: 2/6 = 1/3
  return otherDice / 3;
}

/** Find a valid bid that is higher than the current bid */
function findValidBid(
  currentBid: Bid | null,
  preferredFace: number,
  targetQuantity: number,
  totalDice: number,
  pacosAreWild: boolean,
): { quantity: number; faceValue: number } | null {
  // Cap quantity at total dice
  const maxQ = totalDice;

  if (!currentBid) {
    // First bid of the round
    const q = Math.max(1, Math.min(targetQuantity, maxQ));
    return { quantity: q, faceValue: preferredFace };
  }

  // Try preferred face at target quantity
  const candidates: { quantity: number; faceValue: number }[] = [];

  // Option 1: Same face, higher quantity
  if (preferredFace === currentBid.faceValue) {
    candidates.push({
      quantity: Math.max(currentBid.quantity + 1, targetQuantity),
      faceValue: preferredFace,
    });
  }

  // Option 2: preferred face with required quantity
  candidates.push({
    quantity: Math.max(targetQuantity, 1),
    faceValue: preferredFace,
  });

  // Option 3: current face + 1 quantity (minimal raise)
  candidates.push({
    quantity: currentBid.quantity + 1,
    faceValue: currentBid.faceValue,
  });

  // Option 4: same quantity, higher face
  if (currentBid.faceValue < 6) {
    candidates.push({
      quantity: currentBid.quantity,
      faceValue: currentBid.faceValue + 1,
    });
  }

  // Find the first valid candidate
  for (const c of candidates) {
    if (c.quantity > maxQ) continue;
    if (c.quantity < 1) continue;
    if (c.faceValue < 1 || c.faceValue > 6) continue;

    const candidateBid: Bid = { ...c, playerId: "" };
    if (isBidHigherThan(candidateBid, currentBid, pacosAreWild)) {
      return c;
    }
  }

  // Fallback: minimal raise — increment quantity on same face
  const fallbackQ = currentBid.quantity + 1;
  if (fallbackQ <= maxQ) {
    return { quantity: fallbackQ, faceValue: currentBid.faceValue };
  }

  // Cannot raise — must challenge
  return null;
}

// =============================================================================
// Easy bot
// =============================================================================
// Looks only at its own dice. Challenges randomly when bid seems high.
// Makes suboptimal choices occasionally.

function computeEasyAction(state: GameState, botId: string): BotAction {
  const ownDice = getOwnDice(state, botId);
  const currentBid = state.currentBid;
  const totalDice = getTotalDiceInPlay(state.players);
  const pacosWild = state.config.pacosAreWild;

  // If there's a current bid, maybe challenge
  if (currentBid) {
    const ownCount = countOwnFace(ownDice, currentBid.faceValue, pacosWild);
    const roughEstimate = ownCount + (totalDice - ownDice.length) / 6;

    // Challenge if bid is way above what we see + random factor
    if (currentBid.quantity > roughEstimate * 1.5 && Math.random() < 0.5) {
      return { type: "challenge" };
    }

    // Random challenge on high bids (30%)
    if (currentBid.quantity > totalDice * 0.6 && Math.random() < 0.3) {
      return { type: "challenge" };
    }
  }

  // Place a bid
  // Pick the face we have most of (excluding pacos for simplicity)
  const faceCounts = [0, 0, 0, 0, 0, 0, 0]; // index 0 unused
  for (const d of ownDice) faceCounts[d]++;

  let bestFace = 2;
  let bestCount = 0;
  for (let f = 2; f <= 6; f++) {
    const c = faceCounts[f] + (pacosWild ? faceCounts[1] : 0);
    if (c > bestCount) {
      bestCount = c;
      bestFace = f;
    }
  }

  // Sometimes pick a random face for variety (20%)
  if (Math.random() < 0.2) {
    bestFace = Math.floor(Math.random() * 5) + 2; // 2-6
  }

  const targetQ = Math.max(1, bestCount + Math.floor(Math.random() * 2));

  const bid = findValidBid(currentBid, bestFace, targetQ, totalDice, pacosWild);
  if (!bid) return { type: "challenge" };

  return { type: "bid", ...bid };
}

// =============================================================================
// Medium bot
// =============================================================================
// Uses probability estimates. Challenges based on statistical likelihood.

function computeMediumAction(state: GameState, botId: string): BotAction {
  const ownDice = getOwnDice(state, botId);
  const currentBid = state.currentBid;
  const totalDice = getTotalDiceInPlay(state.players);
  const pacosWild = state.config.pacosAreWild;

  if (currentBid) {
    const ownCount = countOwnFace(ownDice, currentBid.faceValue, pacosWild);
    const expectedOthers = estimateOthers(
      totalDice,
      ownDice.length,
      currentBid.faceValue,
      pacosWild,
    );
    const expectedTotal = ownCount + expectedOthers;

    // Probability-based challenge: if bid is 40%+ above expected
    if (currentBid.quantity > expectedTotal * 1.4) {
      return { type: "challenge" };
    }

    // Moderate chance to challenge if bid is above expected
    if (currentBid.quantity > expectedTotal * 1.15 && Math.random() < 0.5) {
      return { type: "challenge" };
    }
  }

  // Pick the face with best estimated count
  let bestFace = 2;
  let bestEstimate = 0;

  for (let f = 2; f <= 6; f++) {
    const own = countOwnFace(ownDice, f, pacosWild);
    const others = estimateOthers(totalDice, ownDice.length, f, pacosWild);
    const est = own + others;
    if (est > bestEstimate) {
      bestEstimate = est;
      bestFace = f;
    }
  }

  // Bid at expected count (rounded), slight conservatism
  const targetQ = Math.max(1, Math.round(bestEstimate - 0.3));

  const bid = findValidBid(currentBid, bestFace, targetQ, totalDice, pacosWild);
  if (!bid) return { type: "challenge" };

  return { type: "bid", ...bid };
}

// =============================================================================
// Hard bot
// =============================================================================
// Bayesian-style reasoning, bluffing, and position-aware play.

function computeHardAction(state: GameState, botId: string): BotAction {
  const ownDice = getOwnDice(state, botId);
  const currentBid = state.currentBid;
  const totalDice = getTotalDiceInPlay(state.players);
  const pacosWild = state.config.pacosAreWild;
  const alivePlayers = state.players.filter((p) => p.isAlive);

  if (currentBid) {
    const ownCount = countOwnFace(ownDice, currentBid.faceValue, pacosWild);
    const expectedOthers = estimateOthers(
      totalDice,
      ownDice.length,
      currentBid.faceValue,
      pacosWild,
    );
    const expectedTotal = ownCount + expectedOthers;

    // Calculate a confidence score using standard deviation
    const otherDice = totalDice - ownDice.length;
    const p = currentBid.faceValue === 1 || !pacosWild ? 1 / 6 : 2 / 6;
    const stdDev = Math.sqrt(otherDice * p * (1 - p));
    const zScore =
      stdDev > 0 ? (currentBid.quantity - expectedTotal) / stdDev : 0;

    // Challenge if bid is significantly above expected (z > 1.2)
    if (zScore > 1.2) {
      return { type: "challenge" };
    }

    // Position-aware: if we have many dice relative to others, play aggressive
    const botPlayer = state.players.find((pp) => pp.id === botId);
    const botDiceCount = botPlayer?.diceCount ?? 0;
    const avgOtherDice =
      alivePlayers.length > 1
        ? (totalDice - botDiceCount) / (alivePlayers.length - 1)
        : 0;
    const hasAdvantage = botDiceCount > avgOtherDice * 1.3;

    // If we're strong, challenge slightly more aggressively
    if (zScore > 0.8 && hasAdvantage && Math.random() < 0.6) {
      return { type: "challenge" };
    }

    // If losing (few dice), be more conservative with challenges
    if (zScore > 1.0 && !hasAdvantage && Math.random() < 0.4) {
      return { type: "challenge" };
    }
  }

  // ── Bidding strategy ──

  // Evaluate all faces
  const faceScores: { face: number; own: number; expected: number }[] = [];
  for (let f = 2; f <= 6; f++) {
    const own = countOwnFace(ownDice, f, pacosWild);
    const others = estimateOthers(totalDice, ownDice.length, f, pacosWild);
    faceScores.push({ face: f, own, expected: own + others });
  }

  // Sort by expected count descending
  faceScores.sort((a, b) => b.expected - a.expected);

  // Sometimes bluff (15%): pick a face we DON'T have
  let chosen = faceScores[0];
  if (Math.random() < 0.15) {
    const bluffCandidates = faceScores.filter((fs) => fs.own === 0);
    if (bluffCandidates.length > 0) {
      chosen = bluffCandidates[Math.floor(Math.random() * bluffCandidates.length)];
    }
  }

  // Bid close to expected, with slight optimism
  const noise = Math.random() < 0.3 ? 1 : 0;
  const targetQ = Math.max(1, Math.round(chosen.expected) + noise);

  const bid = findValidBid(
    currentBid,
    chosen.face,
    targetQ,
    totalDice,
    pacosWild,
  );
  if (!bid) return { type: "challenge" };

  return { type: "bid", ...bid };
}

// =============================================================================
// Bot action delay (thinking time simulation)
// =============================================================================

/** Returns a random delay in ms based on difficulty */
export function getBotThinkingDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case "easy":
      return 800 + Math.random() * 1200; // 0.8 – 2s
    case "medium":
      return 1200 + Math.random() * 1800; // 1.2 – 3s
    case "hard":
      return 1500 + Math.random() * 2500; // 1.5 – 4s
  }
}
