// =============================================================================
// FEATURE — Tutorial types
// =============================================================================

import type { GamePhase } from "@/core/game-engine/types";

/** How the player advances past a step */
export type StepAdvanceCondition =
  | { type: "click-continue" }
  | { type: "place-bid"; quantity: number; faceValue: number }
  | { type: "call-challenge" }
  | { type: "auto"; delayMs: number }
  | { type: "free-play" }
  | { type: "phase-change"; phase: GamePhase };

/** A single step in the tutorial flow */
export interface TutorialStep {
  /** Unique step id */
  id: string;
  /** data-tutorial-id attribute to highlight (null = no highlight) */
  highlightTarget: string | null;
  /** i18n key under "tutorial.steps" */
  messageKey: string;
  /** Tooltip position relative to the highlighted target */
  tooltipPosition: "top" | "bottom" | "left" | "right" | "center";
  /** How the player advances past this step */
  advanceCondition: StepAdvanceCondition;
  /** Scripted bot action to execute AFTER this step completes */
  botAction?: { type: "bid"; quantity: number; faceValue: number } | { type: "challenge" };
  /** Fixed dice to use when this step triggers a new round */
  scriptedDice?: { player: number[]; bot: number[] };
  /** If true, dim everything and show as a full-screen info step */
  isFullScreen?: boolean;
}

/** Current tutorial state */
export interface TutorialState {
  currentStepIndex: number;
  isComplete: boolean;
}
