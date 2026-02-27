// =============================================================================
// CORE DOMAIN — Types ELO
// =============================================================================
// Types purs pour le système de classement ELO.
// Aucune dépendance externe.
// =============================================================================

/** Représente un joueur dans le calcul ELO */
export interface EloPlayer {
  readonly id: string;
  readonly elo: number;
  /** Position finale (1 = gagnant, 2 = 2ème éliminé, etc.) */
  readonly placement: number;
}

/** Résultat du calcul ELO pour un joueur */
export interface EloChange {
  readonly playerId: string;
  readonly oldElo: number;
  readonly newElo: number;
  readonly delta: number;
}

/** Configuration du système ELO */
export interface EloConfig {
  /** ELO de départ pour les nouveaux joueurs */
  readonly defaultElo: number;
  /** ELO minimum */
  readonly minElo: number;
  /** ELO maximum */
  readonly maxElo: number;
  /** Facteur K pour les nouveaux joueurs (< 30 parties) */
  readonly kFactorNew: number;
  /** Facteur K standard */
  readonly kFactorNormal: number;
  /** Facteur K pour les joueurs haut classement (> 2400) */
  readonly kFactorHigh: number;
  /** Seuil de parties pour passer de "nouveau" à "normal" */
  readonly newPlayerThreshold: number;
  /** Seuil ELO pour le K-factor réduit */
  readonly highEloThreshold: number;
}

/** Configuration par défaut */
export const DEFAULT_ELO_CONFIG: EloConfig = {
  defaultElo: 1000,
  minElo: 100,
  maxElo: 3000,
  kFactorNew: 40,
  kFactorNormal: 20,
  kFactorHigh: 10,
  newPlayerThreshold: 30,
  highEloThreshold: 2000,
} as const;
