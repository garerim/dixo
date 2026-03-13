// =============================================================================
// CORE — Rank System (ELO-based)
// =============================================================================
// Définit les rangs compétitifs basés sur l'ELO.
// Aucune dépendance externe — module pur.
// =============================================================================

/** Identifiant de rang */
export type RankTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master";

/** Définition d'un rang */
export interface RankDefinition {
  readonly tier: RankTier;
  readonly label: string;
  readonly minElo: number;
  /** null = pas de plafond (Master) */
  readonly maxElo: number | null;
  readonly color: string;
  readonly bgColor: string;
  readonly borderColor: string;
  /** Nom de l'icône lucide (résolu côté UI) */
  readonly icon: string;
  /** Description courte du rang */
  readonly description: string;
}

/** Tous les rangs, ordonnés du plus bas au plus élevé */
export const RANK_DEFINITIONS: readonly RankDefinition[] = [
  {
    tier: "bronze",
    label: "Bronze",
    minElo: 0,
    maxElo: 1099,
    color: "text-amber-700",
    bgColor: "bg-amber-700/10",
    borderColor: "border-amber-700/30",
    icon: "shield",
    description: "Welcome to Dixo! Learn the ropes, practice your bluffs, and start climbing.",
  },
  {
    tier: "silver",
    label: "Silver",
    minElo: 1100,
    maxElo: 1199,
    color: "text-slate-400",
    bgColor: "bg-slate-400/10",
    borderColor: "border-slate-400/30",
    icon: "shield",
    description: "You know the basics. Time to sharpen your strategy and outsmart your opponents.",
  },
  {
    tier: "gold",
    label: "Gold",
    minElo: 1200,
    maxElo: 1349,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    icon: "medal",
    description: "Solid player. Your reads are getting better, and your bluffs are convincing.",
  },
  {
    tier: "platinum",
    label: "Platinum",
    minElo: 1350,
    maxElo: 1499,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    borderColor: "border-cyan-400/30",
    icon: "medal",
    description: "Elite territory. You can read the table and know when to push your luck.",
  },
  {
    tier: "diamond",
    label: "Diamond",
    minElo: 1500,
    maxElo: 1699,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/30",
    icon: "gem",
    description: "Top tier. Your opponents fear your challenges and respect your bids.",
  },
  {
    tier: "master",
    label: "Master",
    minElo: 1700,
    maxElo: null,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    icon: "crown",
    description: "The pinnacle. You are among the best Dixo players in the world.",
  },
] as const;

// =============================================================================
// Fonctions utilitaires
// =============================================================================

/**
 * Retourne le rang correspondant à un ELO donné.
 */
export function getRankForElo(elo: number): RankDefinition {
  for (let i = RANK_DEFINITIONS.length - 1; i >= 0; i--) {
    if (elo >= RANK_DEFINITIONS[i].minElo) {
      return RANK_DEFINITIONS[i];
    }
  }
  return RANK_DEFINITIONS[0];
}

/**
 * Retourne le rang suivant, ou null si déjà Master.
 */
export function getNextRank(rank: RankDefinition): RankDefinition | null {
  const idx = RANK_DEFINITIONS.findIndex((r) => r.tier === rank.tier);
  if (idx === -1 || idx >= RANK_DEFINITIONS.length - 1) return null;
  return RANK_DEFINITIONS[idx + 1];
}

/**
 * Progression (0-1) au sein du rang actuel.
 * Retourne 1 pour Master (pas de plafond).
 */
export function getEloProgressInRank(elo: number, rank: RankDefinition): number {
  if (rank.maxElo === null) return 1;
  const range = rank.maxElo - rank.minElo + 1;
  const progress = (elo - rank.minElo) / range;
  return Math.max(0, Math.min(1, progress));
}
