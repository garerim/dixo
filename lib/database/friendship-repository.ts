// =============================================================================
// INFRASTRUCTURE — Friendship Repository
// =============================================================================
// Couche d'accès aux données pour les amitiés.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FriendshipRow, FriendshipStatus } from "@/types/database";

export class FriendshipRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Crée une demande d'amitié.
   */
  async create(
    userId: string,
    friendId: string,
  ): Promise<FriendshipRow> {
    const { data, error } = await this.supabase
      .from("friendships")
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Erreur création amitié: ${error?.message ?? "Données manquantes"}`);
    }

    return data;
  }

  /**
   * Met à jour le statut d'une amitié.
   */
  async updateStatus(
    friendshipId: string,
    status: FriendshipStatus,
  ): Promise<FriendshipRow | null> {
    const { data, error } = await this.supabase
      .from("friendships")
      .update({ status })
      .eq("id", friendshipId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Erreur mise à jour amitié: ${error.message}`);
    }

    return data;
  }

  /**
   * Supprime une amitié.
   */
  async delete(friendshipId: string): Promise<void> {
    const { error } = await this.supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      throw new Error(`Erreur suppression amitié: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les amitiés d'un utilisateur (acceptées et en attente).
   */
  async findByUserId(userId: string): Promise<FriendshipRow[]> {
    const { data, error } = await this.supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error || !data) return [];
    return data;
  }

  /**
   * Récupère une amitié spécifique entre deux utilisateurs.
   */
  async findBetweenUsers(
    userId: string,
    friendId: string,
  ): Promise<FriendshipRow | null> {
    // Chercher dans les deux sens (user_id -> friend_id ou friend_id -> user_id)
    const { data: data1 } = await this.supabase
      .from("friendships")
      .select("*")
      .eq("user_id", userId)
      .eq("friend_id", friendId)
      .maybeSingle();

    if (data1) return data1;

    const { data: data2 } = await this.supabase
      .from("friendships")
      .select("*")
      .eq("user_id", friendId)
      .eq("friend_id", userId)
      .maybeSingle();

    return data2;
  }

  /**
   * Récupère les demandes d'amitié reçues (pending) pour un utilisateur.
   */
  async findPendingReceived(userId: string): Promise<FriendshipRow[]> {
    const { data, error } = await this.supabase
      .from("friendships")
      .select("*")
      .eq("friend_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  }

  /**
   * Vérifie si deux utilisateurs sont amis (statut accepted).
   */
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const friendship = await this.findBetweenUsers(userId, friendId);
    return friendship?.status === "accepted";
  }
}
