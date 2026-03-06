// =============================================================================
// SERVICE — Message Service
// =============================================================================
// Gère les messages privés entre utilisateurs.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { PrivateMessage } from "@/types/api";
import { MessageRepository } from "@/lib/database/message-repository";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { FriendshipService } from "./friendship-service";

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class MessageService {
  private readonly messages: MessageRepository;
  private readonly profiles: ProfileRepository;
  private readonly friendships: FriendshipService;

  constructor(supabase: SupabaseClient<Database>) {
    this.messages = new MessageRepository(supabase);
    this.profiles = new ProfileRepository(supabase);
    this.friendships = new FriendshipService(supabase);
  }

  /**
   * Envoie un message privé.
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<ServiceResult<PrivateMessage>> {
    try {
      // Vérifier que l'utilisateur ne s'envoie pas un message à lui-même
      if (senderId === receiverId) {
        return { success: false, error: "Vous ne pouvez pas vous envoyer un message." };
      }

      // Vérifier que les utilisateurs sont amis
      const areFriends = await this.friendships.areFriends(senderId, receiverId);
      if (!areFriends) {
        return { success: false, error: "Vous devez être amis pour envoyer un message." };
      }

      // Vérifier que le contenu n'est pas vide
      if (!content.trim()) {
        return { success: false, error: "Le message ne peut pas être vide." };
      }

      // Envoyer le message
      const message = await this.messages.send(senderId, receiverId, content);

      // Récupérer les profils pour enrichir le message
      const senderProfile = await this.profiles.findById(senderId);
      if (!senderProfile) {
        return { success: false, error: "Profil expéditeur non trouvé." };
      }

      const result: PrivateMessage = {
        id: message.id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        senderPseudo: senderProfile.pseudo,
        senderAvatarUrl: senderProfile.avatar_url,
        content: message.content,
        isRead: message.is_read,
        createdAt: message.created_at,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Récupère la conversation entre deux utilisateurs.
   */
  async getConversation(
    userId: string,
    friendId: string,
    limit: number = 50,
    before?: string,
  ): Promise<ServiceResult<PrivateMessage[]>> {
    try {
      // Vérifier que les utilisateurs sont amis
      const areFriends = await this.friendships.areFriends(userId, friendId);
      if (!areFriends) {
        return { success: false, error: "You must be friends to view this conversation." };
      }

      // Récupérer les messages
      const messages = await this.messages.getConversation(userId, friendId, limit, before);

      // Enrichir avec les profils
      const senderProfiles = new Map<string, { pseudo: string; avatarUrl: string | null }>();
      for (const message of messages) {
        if (!senderProfiles.has(message.sender_id)) {
          const profile = await this.profiles.findById(message.sender_id);
          if (profile) {
            senderProfiles.set(message.sender_id, {
              pseudo: profile.pseudo,
              avatarUrl: profile.avatar_url,
            });
          }
        }
      }

      const result: PrivateMessage[] = messages.map((msg) => {
        const sender = senderProfiles.get(msg.sender_id);
        return {
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          senderPseudo: sender?.pseudo ?? "Unknown",
          senderAvatarUrl: sender?.avatarUrl ?? null,
          content: msg.content,
          isRead: msg.is_read,
          createdAt: msg.created_at,
        };
      });

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Marque les messages d'une conversation comme lus.
   */
  async markAsRead(
    userId: string,
    friendId: string,
  ): Promise<ServiceResult<void>> {
    try {
      await this.messages.markAsRead(userId, friendId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Récupère le nombre de messages non lus.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messages.countUnread(userId);
  }
}
