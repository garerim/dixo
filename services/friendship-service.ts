// =============================================================================
// SERVICE — Friendship Service
// =============================================================================
// Gère les amitiés entre utilisateurs.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { FriendInfo } from "@/types/api";
import { FriendshipRepository } from "@/lib/database/friendship-repository";
import { ProfileRepository } from "@/lib/database/profile-repository";

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class FriendshipService {
  private readonly friendships: FriendshipRepository;
  private readonly profiles: ProfileRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.friendships = new FriendshipRepository(supabase);
    this.profiles = new ProfileRepository(supabase);
  }

  /**
   * Récupère la liste des amis d'un utilisateur.
   */
  async getFriends(userId: string): Promise<ServiceResult<FriendInfo[]>> {
    try {
      const friendships = await this.friendships.findByUserId(userId);
      const friends: FriendInfo[] = [];

      for (const friendship of friendships) {
        // Déterminer qui est l'ami (celui qui n'est pas l'utilisateur)
        const friendId =
          friendship.user_id === userId
            ? friendship.friend_id
            : friendship.user_id;

        const profile = await this.profiles.findById(friendId);
        if (!profile) continue;

        friends.push({
          id: friendId,
          pseudo: profile.pseudo,
          avatarUrl: profile.avatar_url,
          elo1v1: profile.elo_1v1,
          elo4p: profile.elo_4p,
          isOnline: profile.is_online,
          status: friendship.status as "pending" | "accepted",
          friendshipId: friendship.id,
          isRequester: friendship.user_id === userId,
        });
      }

      return { success: true, data: friends };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  /**
   * Envoie une demande d'amitié.
   */
  async addFriend(
    userId: string,
    friendId: string,
  ): Promise<ServiceResult<{ friendshipId: string }>> {
    try {
      // Vérifier que l'utilisateur n'essaie pas de s'ajouter lui-même
      if (userId === friendId) {
        return { success: false, error: "Vous ne pouvez pas vous ajouter vous-même." };
      }

      // Vérifier que l'ami existe
      const friendProfile = await this.profiles.findById(friendId);
      if (!friendProfile) {
        return { success: false, error: "Utilisateur non trouvé." };
      }

      // Vérifier qu'il n'y a pas déjà une amitié
      const existing = await this.friendships.findBetweenUsers(userId, friendId);
      if (existing) {
        if (existing.status === "accepted") {
          return { success: false, error: "Vous êtes déjà amis." };
        }
        if (existing.status === "pending") {
          return { success: false, error: "Une demande d'amitié est déjà en attente." };
        }
      }

      // Créer la demande
      const friendship = await this.friendships.create(userId, friendId);

      return { success: true, data: { friendshipId: friendship.id } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  /**
   * Accepte ou refuse une demande d'amitié.
   */
  async respondToRequest(
    userId: string,
    friendshipId: string,
    accept: boolean,
  ): Promise<ServiceResult<void>> {
    try {
      // Récupérer l'amitié
      const friendships = await this.friendships.findByUserId(userId);
      const friendship = friendships.find((f) => f.id === friendshipId);

      if (!friendship) {
        return { success: false, error: "Demande d'amitié non trouvée." };
      }

      // Vérifier que c'est bien une demande reçue (friend_id = userId)
      if (friendship.friend_id !== userId || friendship.status !== "pending") {
        return {
          success: false,
          error: "Vous ne pouvez pas répondre à cette demande.",
        };
      }

      if (accept) {
        await this.friendships.updateStatus(friendshipId, "accepted");
      } else {
        await this.friendships.delete(friendshipId);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  /**
   * Supprime une amitié.
   */
  async removeFriend(
    userId: string,
    friendshipId: string,
  ): Promise<ServiceResult<void>> {
    try {
      // Vérifier que l'amitié appartient à l'utilisateur
      const friendships = await this.friendships.findByUserId(userId);
      const friendship = friendships.find((f) => f.id === friendshipId);

      if (!friendship) {
        return { success: false, error: "Amitié non trouvée." };
      }

      await this.friendships.delete(friendshipId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue.",
      };
    }
  }

  /**
   * Vérifie si deux utilisateurs sont amis.
   */
  async areFriends(userId: string, friendId: string): Promise<boolean> {
    return this.friendships.areFriends(userId, friendId);
  }
}
