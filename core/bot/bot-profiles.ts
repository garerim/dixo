// =============================================================================
// CORE — Bot profiles & identities
// =============================================================================
// Pure data — no external dependencies.
// =============================================================================

/** Difficulty levels for bot AI */
export type BotDifficulty = "easy" | "medium" | "hard";

/** Bot player identity */
export interface BotProfile {
  /** Synthetic ID (e.g. "bot-easy-0") */
  readonly id: string;
  /** Display name shown in-game */
  readonly displayName: string;
  /** Difficulty level */
  readonly difficulty: BotDifficulty;
}

// ── Name pools per difficulty ──

const EASY_NAMES = [
  "Rookie Rick",
  "Chill Charlie",
  "Lazy Luna",
  "Slow Sam",
  "Casual Carl",
  "Newbie Nora",
] as const;

const MEDIUM_NAMES = [
  "Sharp Steve",
  "Clever Clara",
  "Sly Simon",
  "Quick Quinn",
  "Steady Sarah",
  "Brisk Bruno",
] as const;

const HARD_NAMES = [
  "Ace Aiden",
  "Viper Vera",
  "Iron Ivan",
  "Shadow Suki",
  "Blitz Boris",
  "Phantom Pia",
] as const;

const NAME_POOLS: Record<BotDifficulty, readonly string[]> = {
  easy: EASY_NAMES,
  medium: MEDIUM_NAMES,
  hard: HARD_NAMES,
};

/**
 * Generates a list of bot profiles.
 *
 * @param count - Number of bots to create (1 to 5)
 * @param difficulty - AI difficulty for all bots
 * @returns Array of BotProfile with unique names
 */
export function createBotProfiles(
  count: 1 | 2 | 3 | 4 | 5,
  difficulty: BotDifficulty,
): BotProfile[] {
  const pool = [...NAME_POOLS[difficulty]];

  // Shuffle the pool for variety
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return Array.from({ length: count }, (_, i) => ({
    id: `bot-${difficulty}-${i}`,
    displayName: pool[i % pool.length],
    difficulty,
  }));
}

/**
 * Check if a player ID belongs to a bot.
 */
export function isBotPlayer(playerId: string): boolean {
  return playerId.startsWith("bot-");
}
