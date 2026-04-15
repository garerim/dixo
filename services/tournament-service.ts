// =============================================================================
// SERVICE — Tournament Orchestrator
// =============================================================================

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  TournamentRepository,
  TournamentParticipantRepository,
  TournamentMatchRepository,
} from "@/lib/database/tournament-repository";
import { EloHistoryRepository } from "@/lib/database/elo-history-repository";
import { UserSkinRepository } from "@/lib/database/user-skin-repository";
import {
  createSingleEliminationBracket,
  recordMatchResult,
  getReadyMatches,
  getPlacements,
  setMatchGameId,
  type BracketState,
  type SeedEntry,
  type BracketMatch,
} from "@/core/tournament";
import {
  createInitialGameState,
  addPlayer,
  startGame,
  GameMode,
  type GameConfig,
} from "@/core/game-engine";
import { GameRepository } from "@/lib/database/game-repository";
import type { TournamentRow } from "@/types/database";

type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

export class TournamentService {
  private tournamentRepo: TournamentRepository;
  private participantRepo: TournamentParticipantRepository;
  private matchRepo: TournamentMatchRepository;
  private gameRepo: GameRepository;
  private eloHistoryRepo: EloHistoryRepository;
  private userSkinRepo: UserSkinRepository;

  constructor() {
    const supabase = getSupabaseAdminClient();
    this.tournamentRepo = new TournamentRepository(supabase);
    this.participantRepo = new TournamentParticipantRepository(supabase);
    this.matchRepo = new TournamentMatchRepository(supabase);
    this.gameRepo = new GameRepository(supabase);
    this.eloHistoryRepo = new EloHistoryRepository(supabase);
    this.userSkinRepo = new UserSkinRepository(supabase);
  }

  // ─── Queries ───

  async getTournament(id: string): Promise<ServiceResult<TournamentRow>> {
    try {
      const tournament = await this.tournamentRepo.findById(id);
      if (!tournament) return { success: false, error: "Tournament not found" };
      return { success: true, data: tournament };
    } catch {
      return { success: false, error: "Failed to fetch tournament" };
    }
  }

  async listOpen(): Promise<ServiceResult<TournamentRow[]>> {
    try {
      const tournaments = await this.tournamentRepo.findOpen();
      return { success: true, data: tournaments };
    } catch {
      return { success: false, error: "Failed to list tournaments" };
    }
  }

  async getTournamentHistory(userId: string): Promise<ServiceResult<TournamentRow[]>> {
    // Get tournament IDs where user participated
    // For now, a simplified approach: query tournaments where user is a participant
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("tournament_id")
        .eq("user_id", userId);

      if (error) throw error;
      if (!data || data.length === 0) return { success: true, data: [] };

      const tournamentIds = data.map((p) => p.tournament_id);
      const { data: tournaments, error: tError } = await supabase
        .from("tournaments")
        .select("*")
        .in("id", tournamentIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (tError) throw tError;
      return { success: true, data: tournaments ?? [] };
    } catch {
      return { success: false, error: "Failed to fetch tournament history" };
    }
  }

  // ─── Registration ───

  async register(tournamentId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      const tournament = await this.tournamentRepo.findById(tournamentId);
      if (!tournament) return { success: false, error: "Tournament not found" };
      if (tournament.status !== "registration") return { success: false, error: "Registration is closed" };

      const count = await this.participantRepo.countByTournament(tournamentId);
      if (count >= tournament.max_participants) return { success: false, error: "Tournament is full" };

      const already = await this.participantRepo.isRegistered(tournamentId, userId);
      if (already) return { success: false, error: "Already registered" };

      await this.participantRepo.register(tournamentId, userId);
      return { success: true, data: undefined };
    } catch {
      return { success: false, error: "Failed to register" };
    }
  }

  async unregister(tournamentId: string, userId: string): Promise<ServiceResult<void>> {
    try {
      const tournament = await this.tournamentRepo.findById(tournamentId);
      if (!tournament) return { success: false, error: "Tournament not found" };
      if (tournament.status !== "registration") return { success: false, error: "Cannot unregister after tournament starts" };

      await this.participantRepo.unregister(tournamentId, userId);
      return { success: true, data: undefined };
    } catch {
      return { success: false, error: "Failed to unregister" };
    }
  }

  // ─── Lifecycle ───

  async startTournament(tournamentId: string): Promise<ServiceResult<void>> {
    try {
      const tournament = await this.tournamentRepo.findById(tournamentId);
      if (!tournament) return { success: false, error: "Tournament not found" };
      if (tournament.status !== "registration") return { success: false, error: "Tournament is not in registration phase" };

      const participants = await this.participantRepo.findByTournament(tournamentId);
      if (participants.length < 2) {
        await this.tournamentRepo.update(tournamentId, { status: "cancelled" });
        return { success: false, error: "Not enough participants — tournament cancelled" };
      }

      // Get ELO for seeding
      const supabase = getSupabaseAdminClient();
      const userIds = participants.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, elo_1v1")
        .in("id", userIds);

      const eloMap: Record<string, number> = {};
      for (const p of profiles ?? []) {
        eloMap[p.id] = p.elo_1v1;
      }

      const seeds: SeedEntry[] = participants.map((p) => ({
        userId: p.user_id,
        elo: eloMap[p.user_id] ?? 1000,
      }));

      // Create bracket
      const bracket = createSingleEliminationBracket(
        seeds,
        tournament.max_participants as 4 | 8 | 16 | 32,
      );

      // Update seeds on participants
      for (const [userId, seed] of Object.entries(bracket.seeds)) {
        const participant = participants.find((p) => p.user_id === userId);
        if (participant) {
          await this.participantRepo.updateSeed(participant.id, seed);
        }
      }

      // Save bracket and transition status
      await this.tournamentRepo.update(tournamentId, {
        status: "in_progress",
        started_at: new Date().toISOString(),
        bracket: bracket as unknown as Record<string, unknown>,
        current_round: 1,
      });

      // Sync matches to tournament_matches table
      await this.syncMatchesToDB(tournamentId, bracket);

      // Create games for ready matches
      const readyMatches = getReadyMatches(bracket);
      for (const match of readyMatches) {
        await this.createMatchGame(tournamentId, tournament, match);
      }

      return { success: true, data: undefined };
    } catch (e) {
      console.error("Failed to start tournament:", e);
      return { success: false, error: "Failed to start tournament" };
    }
  }

  /**
   * Called when a game within a tournament reaches GAME_OVER.
   * Advances the bracket and creates next-round games if ready.
   */
  async onGameCompleted(gameId: string, winnerId: string): Promise<ServiceResult<void>> {
    try {
      const matchRow = await this.matchRepo.findByGameId(gameId);
      if (!matchRow) return { success: true, data: undefined }; // Not a tournament game

      const tournament = await this.tournamentRepo.findById(matchRow.tournament_id);
      if (!tournament || tournament.status !== "in_progress") {
        return { success: true, data: undefined };
      }

      // Update match winner
      await this.matchRepo.setWinner(matchRow.id, winnerId);

      // Eliminate loser
      const loserId = matchRow.player1_id === winnerId ? matchRow.player2_id : matchRow.player1_id;
      if (loserId) {
        // Placement = remaining players count (rough estimate, refined at tournament end)
        await this.participantRepo.eliminate(matchRow.tournament_id, loserId, 0);
      }

      // Advance bracket
      const bracket = tournament.bracket as unknown as BracketState;
      const result = recordMatchResult(bracket, matchRow.round, matchRow.match_index, winnerId);

      if (!result.success) {
        console.error("Failed to advance bracket:", result.error);
        return { success: false, error: result.error ?? "Failed to advance bracket" };
      }

      // Save updated bracket
      await this.tournamentRepo.updateBracket(
        matchRow.tournament_id,
        result.bracket as unknown as Record<string, unknown>,
        result.isComplete ? tournament.current_round : Math.max(tournament.current_round, matchRow.round + 1),
      );

      // Sync updated matches to DB
      await this.syncMatchesToDB(matchRow.tournament_id, result.bracket);

      // If tournament is complete, finalize
      if (result.isComplete && result.winnerId) {
        await this.finalizeTournament(matchRow.tournament_id, result.winnerId, result.bracket);
      } else {
        // Create games for newly ready matches
        for (const match of result.newReadyMatches) {
          await this.createMatchGame(matchRow.tournament_id, tournament, match);
        }
      }

      return { success: true, data: undefined };
    } catch (e) {
      console.error("Failed to process tournament game completion:", e);
      return { success: false, error: "Failed to process game completion" };
    }
  }

  // ─── Auto-scheduling ───

  /**
   * Creates automatic tournaments for today.
   * Should be called by a cron job or on-demand.
   */
  async createAutomaticTournaments(
    times: string[], // e.g. ["14:00", "21:00"]
    rewardSkinId: string | null = null,
  ): Promise<ServiceResult<string[]>> {
    try {
      const createdIds: string[] = [];
      const today = new Date();

      for (const time of times) {
        const [hours, minutes] = time.split(":").map(Number);
        const deadline = new Date(today);
        deadline.setHours(hours, minutes, 0, 0);

        // Skip if time has already passed
        if (deadline.getTime() < Date.now()) continue;

        // Check if a tournament already exists for this slot
        const existing = await this.tournamentRepo.findOpen();
        const alreadyExists = existing.some((t) => {
          const d = new Date(t.registration_deadline);
          return d.getHours() === hours && d.getMinutes() === minutes &&
            d.toDateString() === deadline.toDateString() && t.is_automatic;
        });
        if (alreadyExists) continue;

        // Registration opens 1h before
        const registrationOpens = new Date(deadline.getTime() - 60 * 60 * 1000);

        const name = `Daily Tournament — ${time}`;
        const tournament = await this.tournamentRepo.create({
          name,
          format: "single_elimination",
          status: "registration",
          max_participants: 8,
          game_config: { initialDiceCount: 5, pacosAreWild: true, turnTimer: 30 },
          registration_deadline: deadline.toISOString(),
          started_at: null,
          completed_at: null,
          bracket: {},
          current_round: 0,
          created_by: null,
          winner_id: null,
          reward_skin_id: rewardSkinId,
          elo_bonus_winner: 50,
          elo_bonus_finalist: 25,
          elo_bonus_semifinalist: 10,
          is_automatic: true,
        });

        createdIds.push(tournament.id);
      }

      return { success: true, data: createdIds };
    } catch (e) {
      console.error("Failed to create automatic tournaments:", e);
      return { success: false, error: "Failed to create automatic tournaments" };
    }
  }

  /**
   * Check and start any tournaments whose registration deadline has passed.
   * Should be called periodically (e.g. every minute via cron, or on API calls).
   */
  async startExpiredRegistrations(): Promise<ServiceResult<number>> {
    try {
      const tournaments = await this.tournamentRepo.findByStatus("registration");
      let started = 0;

      for (const t of tournaments) {
        if (new Date(t.registration_deadline).getTime() <= Date.now()) {
          const result = await this.startTournament(t.id);
          if (result.success) started++;
        }
      }

      return { success: true, data: started };
    } catch {
      return { success: false, error: "Failed to check expired registrations" };
    }
  }

  // ─── Internal helpers ───

  private async createMatchGame(
    tournamentId: string,
    tournament: TournamentRow,
    match: BracketMatch,
  ): Promise<void> {
    if (!match.player1Id || !match.player2Id) return;

    const supabase = getSupabaseAdminClient();
    const config = tournament.game_config as Record<string, unknown>;

    // Get player profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, pseudo, avatar_url, subscription, dice_skin")
      .in("id", [match.player1Id, match.player2Id]);

    if (!profiles || profiles.length !== 2) return;

    const p1 = profiles.find((p) => p.id === match.player1Id)!;
    const p2 = profiles.find((p) => p.id === match.player2Id)!;

    const gameConfig: GameConfig = {
      minPlayers: 2,
      maxPlayers: 2,
      initialDiceCount: (config.initialDiceCount as number) ?? 5,
      pacosAreWild: (config.pacosAreWild as boolean) ?? true,
      turnTimer: (config.turnTimer as number) ?? 30,
    };

    // Create game via engine
    let state = createInitialGameState(
      crypto.randomUUID(),
      { id: p1.id, displayName: p1.pseudo, avatarUrl: p1.avatar_url ?? undefined, subscription: p1.subscription, diceSkin: p1.dice_skin ?? undefined },
      GameMode.PRIVATE,
      gameConfig,
    );

    const addResult = addPlayer(state, {
      id: p2.id,
      displayName: p2.pseudo,
      avatarUrl: p2.avatar_url ?? undefined,
      subscription: p2.subscription,
      diceSkin: p2.dice_skin ?? undefined,
    });
    state = addResult.state;

    // Start the game immediately
    const startResult = startGame(state, p1.id);
    state = startResult.state;

    // Save to DB — GameRepository.create() returns GameState
    const savedState = await this.gameRepo.create(state);

    // Link match to game
    const matchRows = await this.matchRepo.findByTournament(tournamentId);
    const dbMatch = matchRows.find(
      (m) => m.round === match.round && m.match_index === match.matchIndex,
    );
    if (dbMatch) {
      await this.matchRepo.setGameId(dbMatch.id, savedState.id);
    }

    // Update bracket with game ID
    const tournament2 = await this.tournamentRepo.findById(tournamentId);
    if (tournament2) {
      const updatedBracket = setMatchGameId(
        tournament2.bracket as unknown as BracketState,
        match.round,
        match.matchIndex,
        savedState.id,
      );
      await this.tournamentRepo.updateBracket(
        tournamentId,
        updatedBracket as unknown as Record<string, unknown>,
        tournament2.current_round,
      );
    }

    // Notify players
    // TODO: send notifications to both players with game ID
  }

  private async finalizeTournament(
    tournamentId: string,
    winnerId: string,
    bracket: BracketState,
  ): Promise<void> {
    const placements = getPlacements(bracket);

    // Complete tournament
    await this.tournamentRepo.complete(tournamentId, winnerId);

    const tournament = await this.tournamentRepo.findById(tournamentId);
    if (!tournament) return;

    // Award ELO bonuses
    const bonuses: { userId: string; bonus: number }[] = [];
    if (placements.winner) {
      bonuses.push({ userId: placements.winner, bonus: tournament.elo_bonus_winner });
    }
    if (placements.finalist) {
      bonuses.push({ userId: placements.finalist, bonus: tournament.elo_bonus_finalist });
    }
    for (const sf of placements.semifinalists) {
      bonuses.push({ userId: sf, bonus: tournament.elo_bonus_semifinalist });
    }

    const supabase = getSupabaseAdminClient();
    for (const { userId, bonus } of bonuses) {
      // Get current ELO
      const { data: profile } = await supabase
        .from("profiles")
        .select("elo_1v1")
        .eq("id", userId)
        .single();

      if (profile) {
        const newElo = profile.elo_1v1 + bonus;
        await supabase
          .from("profiles")
          .update({ elo_1v1: newElo })
          .eq("id", userId);

        await this.eloHistoryRepo.insert({
          userId,
          elo: newElo,
          delta: bonus,
          gameId: null,
          tournamentId,
          rankedMode: "1v1",
        });
      }
    }

    // Grant skin reward to winner
    if (tournament.reward_skin_id && placements.winner) {
      await this.userSkinRepo.grantSkin(placements.winner, tournament.reward_skin_id);
    }

    // Update profile tournament stats
    const participants = await this.participantRepo.findByTournament(tournamentId);
    for (const p of participants) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("tournaments_played, tournaments_won")
        .eq("id", p.user_id)
        .single();

      if (prof) {
        await supabase
          .from("profiles")
          .update({
            tournaments_played: prof.tournaments_played + 1,
            tournaments_won: p.user_id === winnerId ? prof.tournaments_won + 1 : prof.tournaments_won,
          })
          .eq("id", p.user_id);
      }
    }

    // Set final placements
    if (placements.winner) await this.participantRepo.eliminate(tournamentId, placements.winner, 1);
    if (placements.finalist) await this.participantRepo.eliminate(tournamentId, placements.finalist, 2);
    for (const sf of placements.semifinalists) {
      await this.participantRepo.eliminate(tournamentId, sf, 3);
    }
  }

  private async syncMatchesToDB(
    tournamentId: string,
    bracket: BracketState,
  ): Promise<void> {
    // Get existing matches
    const existing = await this.matchRepo.findByTournament(tournamentId);

    for (const bMatch of bracket.matches) {
      const dbMatch = existing.find(
        (m) => m.round === bMatch.round && m.match_index === bMatch.matchIndex && m.bracket_side === bMatch.bracketSide,
      );

      if (dbMatch) {
        // Update existing
        await this.matchRepo.update(dbMatch.id, {
          player1_id: bMatch.player1Id,
          player2_id: bMatch.player2Id,
          winner_id: bMatch.winnerId,
          status: bMatch.status,
          game_id: bMatch.gameId,
        });
      } else {
        // Insert new
        await this.matchRepo.createMany([{
          tournament_id: tournamentId,
          game_id: bMatch.gameId,
          round: bMatch.round,
          match_index: bMatch.matchIndex,
          bracket_side: bMatch.bracketSide,
          player1_id: bMatch.player1Id,
          player2_id: bMatch.player2Id,
          winner_id: bMatch.winnerId,
          status: bMatch.status,
        }]);
      }
    }
  }
}
