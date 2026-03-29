// =============================================================================
// INFRASTRUCTURE — Tournament Repositories
// =============================================================================
// Couche d'accès aux données pour les tournois.
// Gère les tournois, les participants et les matchs.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  TournamentRow,
  TournamentParticipantRow,
  TournamentMatchRow,
  TournamentStatusDB,
} from "@/types/database";

// =============================================================================
// TournamentRepository
// =============================================================================

export class TournamentRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Récupère un tournoi par son ID.
   */
  async findById(id: string): Promise<TournamentRow | null> {
    const { data, error } = await this.supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return data;
  }

  /**
   * Récupère les tournois ouverts (inscription ou en cours).
   */
  async findOpen(): Promise<TournamentRow[]> {
    const { data, error } = await this.supabase
      .from("tournaments")
      .select("*")
      .in("status", ["registration", "in_progress"])
      .order("registration_deadline", { ascending: true });

    if (error || !data) return [];

    return data;
  }

  /**
   * Récupère les tournois par statut.
   */
  async findByStatus(status: TournamentStatusDB): Promise<TournamentRow[]> {
    const { data, error } = await this.supabase
      .from("tournaments")
      .select("*")
      .eq("status", status);

    if (error || !data) return [];

    return data;
  }

  /**
   * Crée un nouveau tournoi.
   */
  async create(
    tournament: Omit<TournamentRow, "id" | "created_at" | "updated_at">
  ): Promise<TournamentRow> {
    const { data, error } = await this.supabase
      .from("tournaments")
      .insert(tournament)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création de tournoi: ${error.message}`);
    }

    return data;
  }

  /**
   * Met à jour un tournoi.
   */
  async update(
    id: string,
    data: Partial<TournamentRow>
  ): Promise<TournamentRow> {
    const { data: updated, error } = await this.supabase
      .from("tournaments")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur mise à jour de tournoi: ${error.message}`);
    }

    return updated;
  }

  /**
   * Met à jour le bracket et le round courant.
   */
  async updateBracket(
    id: string,
    bracket: Record<string, unknown>,
    currentRound: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from("tournaments")
      .update({
        bracket,
        current_round: currentRound,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Erreur mise à jour du bracket: ${error.message}`);
    }
  }

  /**
   * Marque un tournoi comme terminé.
   */
  async complete(id: string, winnerId: string): Promise<void> {
    const { error } = await this.supabase
      .from("tournaments")
      .update({
        status: "completed",
        winner_id: winnerId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Erreur complétion du tournoi: ${error.message}`);
    }
  }
}

// =============================================================================
// TournamentParticipantRepository
// =============================================================================

export class TournamentParticipantRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Récupère tous les participants d'un tournoi.
   */
  async findByTournament(
    tournamentId: string
  ): Promise<TournamentParticipantRow[]> {
    const { data, error } = await this.supabase
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", tournamentId);

    if (error || !data) return [];

    return data;
  }

  /**
   * Compte le nombre de participants d'un tournoi.
   */
  async countByTournament(tournamentId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    if (error) {
      throw new Error(`Erreur comptage des participants: ${error.message}`);
    }

    return count ?? 0;
  }

  /**
   * Inscrit un joueur à un tournoi.
   */
  async register(
    tournamentId: string,
    userId: string
  ): Promise<TournamentParticipantRow> {
    const { data, error } = await this.supabase
      .from("tournament_participants")
      .insert({ tournament_id: tournamentId, user_id: userId })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur inscription au tournoi: ${error.message}`);
    }

    return data;
  }

  /**
   * Désinscrit un joueur d'un tournoi.
   */
  async unregister(tournamentId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("tournament_participants")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Erreur désinscription du tournoi: ${error.message}`);
    }
  }

  /**
   * Vérifie si un joueur est inscrit à un tournoi.
   */
  async isRegistered(
    tournamentId: string,
    userId: string
  ): Promise<boolean> {
    const { count, error } = await this.supabase
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Erreur vérification inscription: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }

  /**
   * Met à jour le seed d'un participant.
   */
  async updateSeed(id: string, seed: number): Promise<void> {
    const { error } = await this.supabase
      .from("tournament_participants")
      .update({ seed })
      .eq("id", id);

    if (error) {
      throw new Error(`Erreur mise à jour du seed: ${error.message}`);
    }
  }

  /**
   * Élimine un participant et enregistre son classement final.
   */
  async eliminate(
    tournamentId: string,
    userId: string,
    placement: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from("tournament_participants")
      .update({ is_eliminated: true, final_placement: placement })
      .eq("tournament_id", tournamentId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Erreur élimination du participant: ${error.message}`);
    }
  }
}

// =============================================================================
// TournamentMatchRepository
// =============================================================================

export class TournamentMatchRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Récupère tous les matchs d'un tournoi, triés par round et index.
   */
  async findByTournament(
    tournamentId: string
  ): Promise<TournamentMatchRow[]> {
    const { data, error } = await this.supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round", { ascending: true })
      .order("match_index", { ascending: true });

    if (error || !data) return [];

    return data;
  }

  /**
   * Récupère un match par son game_id.
   */
  async findByGameId(gameId: string): Promise<TournamentMatchRow | null> {
    const { data, error } = await this.supabase
      .from("tournament_matches")
      .select("*")
      .eq("game_id", gameId)
      .single();

    if (error || !data) return null;

    return data;
  }

  /**
   * Récupère les matchs prêts à être lancés.
   */
  async findReady(tournamentId: string): Promise<TournamentMatchRow[]> {
    const { data, error } = await this.supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("status", "ready");

    if (error || !data) return [];

    return data;
  }

  /**
   * Crée plusieurs matchs en une seule opération.
   */
  async createMany(
    matches: Omit<TournamentMatchRow, "id" | "created_at" | "updated_at">[]
  ): Promise<TournamentMatchRow[]> {
    const { data, error } = await this.supabase
      .from("tournament_matches")
      .insert(matches)
      .select();

    if (error) {
      throw new Error(`Erreur création des matchs: ${error.message}`);
    }

    return data;
  }

  /**
   * Met à jour un match.
   */
  async update(
    id: string,
    data: Partial<TournamentMatchRow>
  ): Promise<void> {
    const { error } = await this.supabase
      .from("tournament_matches")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(`Erreur mise à jour du match: ${error.message}`);
    }
  }

  /**
   * Associe une partie à un match et le passe en cours.
   */
  async setGameId(id: string, gameId: string): Promise<void> {
    const { error } = await this.supabase
      .from("tournament_matches")
      .update({
        game_id: gameId,
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Erreur association de la partie au match: ${error.message}`);
    }
  }

  /**
   * Enregistre le vainqueur d'un match.
   */
  async setWinner(id: string, winnerId: string): Promise<void> {
    const { error } = await this.supabase
      .from("tournament_matches")
      .update({
        winner_id: winnerId,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(`Erreur enregistrement du vainqueur: ${error.message}`);
    }
  }
}
