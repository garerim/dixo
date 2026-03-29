// =============================================================================
// Tournament Engine — Domain Types
// =============================================================================
// Pure types with no external dependencies.
// =============================================================================

export type TournamentFormat = "single_elimination" | "double_elimination";

export type TournamentStatus =
  | "registration"
  | "starting"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MatchStatus = "pending" | "ready" | "in_progress" | "completed" | "bye";

export type BracketSide = "winners" | "losers";

export interface BracketMatch {
  readonly round: number;
  readonly matchIndex: number;
  readonly bracketSide: BracketSide;
  readonly player1Id: string | null;
  readonly player2Id: string | null;
  readonly winnerId: string | null;
  readonly gameId: string | null;
  readonly status: MatchStatus;
}

export interface BracketState {
  readonly format: TournamentFormat;
  readonly totalRounds: number;
  readonly seeds: Record<string, number>;
  readonly matches: readonly BracketMatch[];
}

export interface TournamentConfig {
  readonly maxParticipants: 4 | 8 | 16 | 32;
  readonly format: TournamentFormat;
  readonly gameConfig: {
    readonly initialDiceCount: number;
    readonly pacosAreWild: boolean;
    readonly turnTimer: number | null;
  };
  readonly eloBonusWinner: number;
  readonly eloBonusFinalist: number;
  readonly eloBonusSemifinalist: number;
  readonly rewardSkinId: string | null;
}

export interface SeedEntry {
  readonly userId: string;
  readonly elo: number;
}

export interface BracketActionResult {
  readonly success: boolean;
  readonly bracket: BracketState;
  readonly error?: string;
  /** Matches that became ready after this action */
  readonly newReadyMatches: readonly BracketMatch[];
  /** True if the tournament is now complete */
  readonly isComplete: boolean;
  /** Winner ID if tournament is complete */
  readonly winnerId: string | null;
}
