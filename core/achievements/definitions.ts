// =============================================================================
// CORE DOMAIN — Achievement Definitions
// =============================================================================
// Module pur sans dépendances externes. Définit les achievements disponibles,
// leurs conditions de déblocage et la logique de détection.
// =============================================================================

import type { ChallengeResult } from "@/core/game-engine/types";

// =============================================================================
// Context — données nécessaires pour évaluer les achievements
// =============================================================================

export interface AchievementContext {
  /** ID du joueur évalué */
  playerId: string;
  /** Le joueur a-t-il gagné cette partie ? */
  isWinner: boolean;
  /** Nombre total de parties jouées (après incrémentation) */
  totalGamesPlayed: number;
  /** ELO max entre 1v1 et 4p */
  maxElo: number;
  /** Nombre de dés du gagnant à la fin de la partie */
  winnerDiceCount: number;
  /** Nombre de dés initial (config) */
  initialDiceCount: number;
  /** Compteur de bluffs consécutifs réussis (depuis le profil) */
  consecutiveBluffWins: number;
  /** Le joueur a-t-il gagné un challenge "Paco only" dans cette partie ? */
  wonPacoOnlyChallenge: boolean;
}

// =============================================================================
// Achievement definition
// =============================================================================

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxProgress: number;
  /** Retourne true si l'achievement est débloqué */
  check: (ctx: AchievementContext) => boolean;
  /** Retourne la progression actuelle (0 → maxProgress) */
  getProgress: (ctx: AchievementContext) => number;
}

// =============================================================================
// Definitions
// =============================================================================

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  FIRST_BLOOD: {
    id: "FIRST_BLOOD",
    name: "First Blood",
    description: "Win your first game",
    icon: "swords",
    maxProgress: 1,
    check: (ctx) => ctx.isWinner,
    getProgress: (ctx) => (ctx.isWinner ? 1 : 0),
  },

  BLUFF_MASTER: {
    id: "BLUFF_MASTER",
    name: "Bluff Master",
    description: "Successfully bluff 10 challenges in a row",
    icon: "theater",
    maxProgress: 10,
    check: (ctx) => ctx.consecutiveBluffWins >= 10,
    getProgress: (ctx) => Math.min(ctx.consecutiveBluffWins, 10),
  },

  PACO_KING: {
    id: "PACO_KING",
    name: "Paco King",
    description: "Win a challenge where only Pacos counted",
    icon: "crown",
    maxProgress: 1,
    check: (ctx) => ctx.wonPacoOnlyChallenge,
    getProgress: (ctx) => (ctx.wonPacoOnlyChallenge ? 1 : 0),
  },

  UNTOUCHABLE: {
    id: "UNTOUCHABLE",
    name: "Untouchable",
    description: "Win a game without losing a single die",
    icon: "shield-check",
    maxProgress: 1,
    check: (ctx) => ctx.isWinner && ctx.winnerDiceCount === ctx.initialDiceCount,
    getProgress: (ctx) =>
      ctx.isWinner && ctx.winnerDiceCount === ctx.initialDiceCount ? 1 : 0,
  },

  VETERAN: {
    id: "VETERAN",
    name: "Veteran",
    description: "Play 100 games",
    icon: "medal",
    maxProgress: 100,
    check: (ctx) => ctx.totalGamesPlayed >= 100,
    getProgress: (ctx) => Math.min(ctx.totalGamesPlayed, 100),
  },

  DIAMOND: {
    id: "DIAMOND",
    name: "Diamond",
    description: "Reach 1500 ELO in any mode",
    icon: "gem",
    maxProgress: 1500,
    check: (ctx) => ctx.maxElo >= 1500,
    getProgress: (ctx) => Math.min(ctx.maxElo, 1500),
  },
};

/** Liste ordonnée de tous les IDs d'achievements */
export const ACHIEVEMENT_IDS = Object.keys(ACHIEVEMENTS);

// =============================================================================
// Paco King detection
// =============================================================================

/**
 * Détecte si un challenge a été gagné uniquement grâce à des Pacos (face 1).
 *
 * Conditions :
 * - Le challenge est correct (le bluff a été révélé)
 * - Soit l'enchère portait directement sur les Pacos (faceValue === 1)
 * - Soit les Pacos sont wild et tous les dés comptés étaient des Pacos
 */
export function detectPacoOnlyChallenge(
  challengeResult: ChallengeResult,
  pacosAreWild: boolean,
): boolean {
  // Le challenger doit avoir gagné
  if (!challengeResult.isChallengeCorrect) return false;

  const targetFace = challengeResult.contestedBid.faceValue;

  // Cas 1 : l'enchère portait directement sur les Pacos
  if (targetFace === 1) return true;

  // Cas 2 : les Pacos sont wild et seuls des Pacos comptaient
  if (!pacosAreWild) return false;

  let pacoCount = 0;
  let exactCount = 0;

  for (const dice of Object.values(challengeResult.revealedDice)) {
    for (const die of dice) {
      if (die === 1) pacoCount++;
      if (die === targetFace) exactCount++;
    }
  }

  // Seuls des Pacos comptaient = il y avait des Pacos mais aucun match exact
  return pacoCount > 0 && exactCount === 0 && challengeResult.actualCount === pacoCount;
}
