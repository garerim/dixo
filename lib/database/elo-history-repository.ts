// =============================================================================
// INFRASTRUCTURE — EloHistory Repository
// =============================================================================
// Couche d'accès aux données pour l'historique ELO.
// Isole la base de données du reste de l'application.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EloHistoryRow } from "@/types/database";

export class EloHistoryRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Ajoute une entrée dans l'historique ELO.
   */
  async insert(entry: {
    userId: string;
    elo: number;
    delta: number;
    gameId: string | null;
    tournamentId?: string | null;
    rankedMode: string;
  }): Promise<EloHistoryRow | null> {
    const { data, error } = await this.supabase
      .from("elo_history")
      .insert({
        user_id: entry.userId,
        elo: entry.elo,
        delta: entry.delta,
        game_id: entry.gameId,
        tournament_id: entry.tournamentId ?? null,
        ranked_mode: entry.rankedMode,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur insertion elo_history: ${error.message}`);
    }

    return data;
  }

  /**
   * Récupère l'historique ELO d'un utilisateur, trié du plus ancien au plus récent.
   * @param userId - ID de l'utilisateur
   * @param limit - Nombre maximum d'entrées (défaut: 50)
   */
  async findByUserId(
    userId: string,
    limit: number = 50,
    rankedMode?: string,
  ): Promise<EloHistoryRow[]> {
    let query = this.supabase
      .from("elo_history")
      .select("*")
      .eq("user_id", userId);

    if (rankedMode) {
      query = query.eq("ranked_mode", rankedMode);
    }

    const { data, error } = await query
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return data;
  }
}
