// =============================================================================
// FEATURE — Tutorial step definitions
// =============================================================================
// Scripted scenarios for the interactive tutorial.
// 1v1 game with 3 dice per player, predetermined rolls.
// =============================================================================

import type { TutorialStep } from "./types";

/**
 * Round 1 dice:
 *   Player: [3, 3, 5]  →  two 3s + one 5
 *   Bot:    [2, 4, 3]  →  one 3 (so total 3s = 3 with pacos=false context)
 *
 * Round 2 dice:
 *   Player: [1, 4, 6]  →  one Paco (wild), one 4, one 6
 *   Bot:    [4, 4]     →  two 4s (bot lost one die in round 1)
 *
 * Round 3 dice:
 *   Player: [2, 5, 3]
 *   Bot:    [6]        →  bot has 1 die left
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  // ─── Welcome ───
  {
    id: "welcome",
    highlightTarget: null,
    messageKey: "welcome",
    tooltipPosition: "center",
    advanceCondition: { type: "click-continue" },
    isFullScreen: true,
    // This step triggers the game start with scripted dice for round 1
    scriptedDice: { player: [3, 3, 5], bot: [2, 4, 3] },
  },

  // ─── Round 1: Seeing your dice ───
  {
    id: "see-dice",
    highlightTarget: "my-dice",
    messageKey: "seeDice",
    tooltipPosition: "top",
    advanceCondition: { type: "click-continue" },
  },
  {
    id: "explain-dice",
    highlightTarget: "my-dice",
    messageKey: "explainDice",
    tooltipPosition: "top",
    advanceCondition: { type: "click-continue" },
  },

  // ─── Round 1: Place first bid ───
  {
    id: "first-bid",
    highlightTarget: "bid-panel",
    messageKey: "firstBid",
    tooltipPosition: "top",
    advanceCondition: { type: "place-bid", quantity: 2, faceValue: 3 },
  },

  // ─── Round 1: Bot raises ───
  {
    id: "bot-raises",
    highlightTarget: "current-bid",
    messageKey: "botRaises",
    tooltipPosition: "bottom",
    advanceCondition: { type: "click-continue" },
    botAction: { type: "bid", quantity: 3, faceValue: 3 },
  },

  // ─── Round 1: Explain raise vs challenge ───
  {
    id: "raise-or-challenge",
    highlightTarget: "bid-panel",
    messageKey: "raiseOrChallenge",
    tooltipPosition: "top",
    advanceCondition: { type: "place-bid", quantity: 3, faceValue: 5 },
  },

  // ─── Round 1: Bot overbids ───
  {
    id: "bot-overbids",
    highlightTarget: "current-bid",
    messageKey: "botOverbids",
    tooltipPosition: "bottom",
    advanceCondition: { type: "click-continue" },
    botAction: { type: "bid", quantity: 4, faceValue: 5 },
  },

  // ─── Round 1: Player challenges ───
  {
    id: "call-challenge",
    highlightTarget: "challenge-button",
    messageKey: "callChallenge",
    tooltipPosition: "top",
    advanceCondition: { type: "call-challenge" },
  },

  // ─── Round 1: Result ───
  {
    id: "result-explain",
    highlightTarget: "result-panel",
    messageKey: "resultExplain",
    tooltipPosition: "top",
    advanceCondition: { type: "click-continue" },
  },

  // ─── Round 1: Explain pacos ───
  {
    id: "pacos-explain",
    highlightTarget: "result-panel",
    messageKey: "pacosExplain",
    tooltipPosition: "top",
    advanceCondition: { type: "click-continue" },
    // This step triggers next round with scripted dice for round 2
    scriptedDice: { player: [1, 4, 6], bot: [4, 4] },
  },

  // ─── Round 2: New round with pacos ───
  {
    id: "round2-start",
    highlightTarget: "my-dice",
    messageKey: "round2Start",
    tooltipPosition: "top",
    advanceCondition: { type: "click-continue" },
  },

  // ─── Round 2: Bot opens (loser starts) ───
  {
    id: "bot-opens-r2",
    highlightTarget: "current-bid",
    messageKey: "botOpensR2",
    tooltipPosition: "bottom",
    advanceCondition: { type: "click-continue" },
    botAction: { type: "bid", quantity: 1, faceValue: 3 },
  },

  // ─── Round 2: Bid with pacos ───
  {
    id: "bid-with-pacos",
    highlightTarget: "bid-panel",
    messageKey: "bidWithPacos",
    tooltipPosition: "top",
    advanceCondition: { type: "place-bid", quantity: 2, faceValue: 4 },
  },

  // ─── Round 2: Bot challenges (incorrectly) ───
  {
    id: "bot-challenges",
    highlightTarget: "result-panel",
    messageKey: "botChallenges",
    tooltipPosition: "top",
    advanceCondition: { type: "click-continue" },
    botAction: { type: "challenge" },
  },

  // ─── Round 2: Explain paco result ───
  {
    id: "paco-result",
    highlightTarget: "result-panel",
    messageKey: "pacoResult",
    tooltipPosition: "top",
    advanceCondition: { type: "click-continue" },
    // Trigger round 3 with scripted dice
    scriptedDice: { player: [2, 5, 3], bot: [6] },
  },

  // ─── Round 3: Free play ───
  {
    id: "free-play",
    highlightTarget: null,
    messageKey: "freePlay",
    tooltipPosition: "top",
    advanceCondition: { type: "free-play" },
    isFullScreen: true,
  },

  // ─── Complete ───
  {
    id: "complete",
    highlightTarget: null,
    messageKey: "complete",
    tooltipPosition: "center",
    advanceCondition: { type: "click-continue" },
    isFullScreen: true,
  },
];
