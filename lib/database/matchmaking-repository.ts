// =============================================================================
// INFRASTRUCTURE — Matchmaking Repository
// =============================================================================
// Accès aux données de la file d'attente de matchmaking.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MatchmakingQueueRow, GameModeDB } from "@/types/database";

export class MatchmakingRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Ajoute un joueur à la file d'attente.
   */
  async enqueue(
    userId: string,
    elo: number,
    gameMode: GameModeDB,
    playerCount: number = 2,
  ): Promise<MatchmakingQueueRow> {
    // Annuler toute entrée existante en attente
    await this.cancelExisting(userId);

    const { data, error } = await this.supabase
      .from("matchmaking_queue")
      .insert({
        user_id: userId,
        elo,
        game_mode: gameMode,
        player_count: playerCount,
        status: "waiting",
        matched_game_id: null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Erreur ajout à la file: ${error?.message ?? "Données manquantes"}`);
    }

    return data;
  }

  /**
   * Annule les entrées existantes en attente pour un joueur
   * et supprime les anciennes entrées cancelled/matched pour éviter
   * les conflits de contrainte unique.
   */
  async cancelExisting(userId: string): Promise<void> {
    // 1. Supprimer les anciennes entrées cancelled/matched
    await this.supabase
      .from("matchmaking_queue")
      .delete()
      .eq("user_id", userId)
      .in("status", ["cancelled", "matched"]);

    // 2. Annuler les entrées en attente
    const { error } = await this.supabase
      .from("matchmaking_queue")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "waiting");

    if (error) {
      throw new Error(`Erreur annulation: ${error.message}`);
    }
  }

  /**
   * Annule une entrée spécifique dans la file.
   */
  async cancel(entryId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("matchmaking_queue")
      .update({ status: "cancelled" })
      .eq("id", entryId)
      .eq("user_id", userId)
      .eq("status", "waiting");

    if (error) {
      throw new Error(`Erreur annulation: ${error.message}`);
    }
  }

  /**
   * Récupère une entrée par son ID.
   */
  async findById(entryId: string): Promise<MatchmakingQueueRow | null> {
    const { data, error } = await this.supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("id", entryId)
      .single();

    if (error || !data) return null;
    return data;
  }

  /**
   * Récupère l'entrée en attente d'un joueur.
   */
  async findWaitingByUserId(userId: string): Promise<MatchmakingQueueRow | null> {
    const { data, error } = await this.supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "waiting")
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  /**
   * Récupère l'entrée active (waiting ou matched) la plus récente d'un joueur.
   * Utilisé pour le polling de statut.
   */
  async findActiveByUserId(userId: string): Promise<MatchmakingQueueRow | null> {
    const { data, error } = await this.supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["waiting", "matched"])
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  /**
   * Récupère tous les joueurs en attente pour un mode de jeu donné.
   */
  async getWaitingEntries(
    gameMode: GameModeDB,
    playerCount?: number,
  ): Promise<MatchmakingQueueRow[]> {
    let query = this.supabase
      .from("matchmaking_queue")
      .select("*")
      .eq("game_mode", gameMode)
      .eq("status", "waiting");

    if (playerCount !== undefined) {
      query = query.eq("player_count", playerCount);
    }

    const { data, error } = await query
      .order("joined_at", { ascending: true });

    if (error || !data) return [];
    return data;
  }

  /**
   * Marque des entrées comme matchées avec un game ID.
   * Utilise une fonction SECURITY DEFINER pour contourner les RLS
   * (Player B ne peut pas modifier l'entrée de Player A sinon).
   */
  async markAsMatched(entryIds: string[], gameId: string): Promise<void> {
    const { error } = await this.supabase.rpc("match_queue_entries", {
      p_entry_ids: entryIds,
      p_game_id: gameId,
    });

    if (error) {
      throw new Error(`Erreur matchmaking: ${error.message}`);
    }
  }

  /**
   * Compte les joueurs en attente pour un mode donné.
   */
  async countWaiting(gameMode: GameModeDB, playerCount?: number): Promise<number> {
    let query = this.supabase
      .from("matchmaking_queue")
      .select("*", { count: "exact", head: true })
      .eq("game_mode", gameMode)
      .eq("status", "waiting");

    if (playerCount !== undefined) {
      query = query.eq("player_count", playerCount);
    }

    const { count, error } = await query;

    if (error) return 0;
    return count ?? 0;
  }
}
