// =============================================================================
// INFRASTRUCTURE — Message Repository
// =============================================================================
// Couche d'accès aux données pour les messages privés.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MessageRow } from "@/types/database";

export class MessageRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Envoie un message privé.
   */
  async send(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<MessageRow> {
    const { data, error } = await this.supabase
      .from("private_messages")
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
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
   * Récupère la conversation entre deux utilisateurs.
   */
  async getConversation(
    userId: string,
    friendId: string,
    limit: number = 50,
    before?: string,
  ): Promise<MessageRow[]> {
    // Récupérer les messages dans les deux sens
    let query = this.supabase
      .from("private_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`,
      )
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
   * Marque les messages comme lus.
   */
  async markAsRead(
    receiverId: string,
    senderId: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .from("private_messages")
      .update({ is_read: true })
      .eq("receiver_id", receiverId)
      .eq("sender_id", senderId)
      .eq("is_read", false);

    if (error) {
      throw new Error(`Erreur marquage messages lus: ${error.message}`);
    }
  }

  /**
   * Récupère le nombre de messages non lus pour un utilisateur.
   */
  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("private_messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (error) return 0;
    return count ?? 0;
  }

  /**
   * Récupère les messages non lus d'une conversation spécifique.
   */
  async getUnreadInConversation(
    userId: string,
    friendId: string,
  ): Promise<MessageRow[]> {
    const { data, error } = await this.supabase
      .from("private_messages")
      .select("*")
      .eq("receiver_id", userId)
      .eq("sender_id", friendId)
      .eq("is_read", false)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data;
  }
}
