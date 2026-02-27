// =============================================================================
// CORE DOMAIN — Logique de matchmaking (fonctions pures)
// =============================================================================
// Algorithme de pairing basé sur l'ELO avec élargissement progressif.
// Aucune dépendance externe.
// =============================================================================

/** Joueur dans la file d'attente */
export interface QueueEntry {
  readonly userId: string;
  readonly elo: number;
  /** Timestamp d'entrée dans la file (ISO string) */
  readonly joinedAt: string;
}

/** Résultat du matchmaking : un groupe de joueurs à mettre en partie */
export interface MatchGroup {
  readonly players: readonly QueueEntry[];
}

/** Configuration du matchmaking */
export interface MatchmakingConfig {
  /** Écart ELO initial accepté */
  readonly initialEloRange: number;
  /** Élargissement de l'écart par seconde d'attente */
  readonly eloRangeExpansionPerSecond: number;
  /** Écart ELO maximum */
  readonly maxEloRange: number;
  /** Nombre de joueurs par partie classée */
  readonly playersPerMatch: number;
}

export const DEFAULT_MATCHMAKING_CONFIG: MatchmakingConfig = {
  initialEloRange: 100,
  eloRangeExpansionPerSecond: 5,
  maxEloRange: 500,
  playersPerMatch: 2,
} as const;

// =============================================================================
// Fonctions pures
// =============================================================================

/**
 * Calcule l'écart ELO acceptable pour un joueur en fonction de son
 * temps d'attente. Plus il attend, plus on élargit le range.
 *
 * @param waitTimeSeconds - Temps d'attente en secondes
 * @param config - Configuration du matchmaking
 * @returns Écart ELO acceptable
 */
export function getAcceptableEloRange(
  waitTimeSeconds: number,
  config: MatchmakingConfig = DEFAULT_MATCHMAKING_CONFIG,
): number {
  const expanded =
    config.initialEloRange +
    waitTimeSeconds * config.eloRangeExpansionPerSecond;

  return Math.min(expanded, config.maxEloRange);
}

/**
 * Vérifie si deux joueurs sont compatibles pour un match.
 *
 * @param entryA - Premier joueur
 * @param entryB - Deuxième joueur
 * @param now - Timestamp actuel
 * @param config - Configuration du matchmaking
 * @returns true si les joueurs sont compatibles
 */
export function arePlayersCompatible(
  entryA: QueueEntry,
  entryB: QueueEntry,
  now: Date,
  config: MatchmakingConfig = DEFAULT_MATCHMAKING_CONFIG,
): boolean {
  const waitA = (now.getTime() - new Date(entryA.joinedAt).getTime()) / 1000;
  const waitB = (now.getTime() - new Date(entryB.joinedAt).getTime()) / 1000;

  // Utiliser le range le plus large des deux joueurs
  const rangeA = getAcceptableEloRange(waitA, config);
  const rangeB = getAcceptableEloRange(waitB, config);
  const effectiveRange = Math.max(rangeA, rangeB);

  const eloDiff = Math.abs(entryA.elo - entryB.elo);

  return eloDiff <= effectiveRange;
}

/**
 * Trouve le meilleur match possible dans la file d'attente.
 *
 * Algorithme :
 * 1. Trier par ELO
 * 2. Pour chaque joueur, chercher les N-1 joueurs les plus proches compatibles
 * 3. Retourner le premier groupe valide trouvé
 *
 * @param queue - File d'attente triée par joinedAt
 * @param now - Timestamp actuel
 * @param config - Configuration du matchmaking
 * @returns Groupe de joueurs à mettre en partie, ou null
 */
export function findMatch(
  queue: readonly QueueEntry[],
  now: Date,
  config: MatchmakingConfig = DEFAULT_MATCHMAKING_CONFIG,
): MatchGroup | null {
  if (queue.length < config.playersPerMatch) {
    return null;
  }

  // Trier par ELO pour trouver les joueurs les plus proches
  const sorted = [...queue].sort((a, b) => a.elo - b.elo);

  // Glisser une fenêtre de playersPerMatch joueurs
  for (let i = 0; i <= sorted.length - config.playersPerMatch; i++) {
    const group = sorted.slice(i, i + config.playersPerMatch);

    // Vérifier que TOUS les joueurs du groupe sont compatibles entre eux
    const allCompatible = group.every((playerA, indexA) =>
      group.every(
        (playerB, indexB) =>
          indexA === indexB ||
          arePlayersCompatible(playerA, playerB, now, config),
      ),
    );

    if (allCompatible) {
      return { players: group };
    }
  }

  return null;
}

/**
 * Calcule l'ELO moyen d'un groupe de joueurs.
 */
export function getAverageElo(entries: readonly QueueEntry[]): number {
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, e) => sum + e.elo, 0);
  return Math.round(total / entries.length);
}
