// =============================================================================
// INFRASTRUCTURE — Game Message Repository
// =============================================================================
// Couche d'accès aux données pour les messages de chat dans les parties.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GameMessageRow } from "@/types/database";

export class GameMessageRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Envoie un message dans une partie.
   */
  async send(
    gameId: string,
    userId: string,
    content: string,
  ): Promise<GameMessageRow> {
    const { data, error } = await this.supabase
      .from("game_messages")
      .insert({
        game_id: gameId,
        user_id: userId,
        content: content.trim(),
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Erreur envoi message: ${error?.message ?? "Données manquantes"}`);
    }

    return data;
  }

  /**
   * Récupère les messages d'une partie.
   */
  async getByGameId(
    gameId: string,
    limit: number = 50,
    before?: string,
  ): Promise<GameMessageRow[]> {
    let query = this.supabase
      .from("game_messages")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;

    if (error || !data) return [];
    return data.reverse(); // Plus ancien en premier
  }

  /**
   * Récupère les nouveaux messages depuis un timestamp.
   */
  async getNewMessages(
    gameId: string,
    since: string,
  ): Promise<GameMessageRow[]> {
    const { data, error } = await this.supabase
      .from("game_messages")
      .select("*")
      .eq("game_id", gameId)
      .gt("created_at", since)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data;
  }
}
