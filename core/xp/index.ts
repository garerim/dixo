// =============================================================================
// CORE — XP & Level System
// =============================================================================
// Calcul pur du niveau et de l'XP à partir des statistiques du joueur.
// Aucune dépendance externe. Tout est dérivé des stats existantes.
// =============================================================================

// =============================================================================
// XP Rewards (par action)
// =============================================================================

/** Points d'XP accordés par action */
export const XP_REWARDS = {
  /** XP pour une victoire */
  WIN: 50,
  /** XP pour une défaite (participation) */
  LOSS: 20,
  /** XP bonus par palier de win streak (best) */
  STREAK_BONUS: 10,
  /** XP par challenge call effectué */
  CHALLENGE_CALL: 5,
  /** XP bonus par challenge réussi */
  CHALLENGE_SUCCESS: 10,
} as const;

// =============================================================================
// Level Curve
// =============================================================================

/**
 * XP requis pour atteindre un niveau donné.
 * Courbe : XP = BASE * level^EXPONENT
 * Niveau 1 = 0 XP, Niveau 2 = 100 XP, Niveau 10 ≈ 2500 XP, etc.
 */
const BASE_XP = 100;
const EXPONENT = 1.5;

/**
 * XP total cumulé nécessaire pour atteindre un niveau.
 * Level 1 = 0, Level 2 = 100, Level 3 = 283, ...
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP * Math.pow(level - 1, EXPONENT));
}

// =============================================================================
// XP Calculation
// =============================================================================

/** Stats nécessaires pour calculer l'XP */
export interface XpStats {
  gamesPlayed: number;
  gamesWon: number;
  totalChallengeCalls: number;
  totalChallengeSuccess: number;
  bestWinStreak: number;
}

/**
 * Calcule le total d'XP à partir des statistiques du joueur.
 */
export function calculateTotalXp(stats: XpStats): number {
  const wins = stats.gamesWon;
  const losses = stats.gamesPlayed - stats.gamesWon;

  let xp = 0;
  xp += wins * XP_REWARDS.WIN;
  xp += losses * XP_REWARDS.LOSS;
  xp += stats.totalChallengeCalls * XP_REWARDS.CHALLENGE_CALL;
  xp += stats.totalChallengeSuccess * XP_REWARDS.CHALLENGE_SUCCESS;
  xp += stats.bestWinStreak * XP_REWARDS.STREAK_BONUS;

  return xp;
}

// =============================================================================
// Level Calculation
// =============================================================================

/** Résultat du calcul de niveau */
export interface LevelInfo {
  /** Niveau actuel */
  level: number;
  /** XP total accumulé */
  totalXp: number;
  /** XP au sein du niveau actuel (progression) */
  currentLevelXp: number;
  /** XP nécessaire pour compléter le niveau actuel */
  xpToNextLevel: number;
  /** Progression dans le niveau actuel (0-1) */
  progress: number;
}

/**
 * Calcule le niveau et la progression à partir des stats.
 */
export function calculateLevel(stats: XpStats): LevelInfo {
  const totalXp = calculateTotalXp(stats);

  // Trouver le niveau actuel
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }

  const currentLevelStart = xpForLevel(level);
  const nextLevelStart = xpForLevel(level + 1);
  const currentLevelXp = totalXp - currentLevelStart;
  const xpToNextLevel = nextLevelStart - currentLevelStart;
  const progress = xpToNextLevel > 0 ? currentLevelXp / xpToNextLevel : 0;

  return {
    level,
    totalXp,
    currentLevelXp,
    xpToNextLevel,
    progress,
  };
}
