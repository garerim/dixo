// =============================================================================
// SERVICE — Notification Service
// =============================================================================
// Gère les notifications in-app pour les utilisateurs.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NotificationType } from "@/types/database";
import type { NotificationInfo } from "@/types/api";
import { NotificationRepository } from "@/lib/database/notification-repository";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas for notification JSONB data — one per notification type
// ---------------------------------------------------------------------------

const friendRequestDataSchema = z.object({
  senderPseudo: z.string(),
  senderAvatarUrl: z.string().nullable(),
  friendshipId: z.string().uuid(),
});

const friendAcceptedDataSchema = z.object({
  senderPseudo: z.string(),
  senderAvatarUrl: z.string().nullable(),
});

const messageReceivedDataSchema = z.object({
  senderId: z.string().uuid(),
  senderPseudo: z.string(),
  senderAvatarUrl: z.string().nullable(),
});

const gameInviteDataSchema = z.object({
  senderPseudo: z.string(),
  gameId: z.string().uuid(),
  joinCode: z.string(),
});

const gameStartedDataSchema = z.object({
  gameId: z.string().uuid(),
});

const achievementUnlockedDataSchema = z.object({
  achievementId: z.string(),
  icon: z.string(),
});

const notificationDataSchemas: Record<NotificationType, z.ZodSchema> = {
  friend_request_received: friendRequestDataSchema,
  friend_request_accepted: friendAcceptedDataSchema,
  message_received: messageReceivedDataSchema,
  game_invite_received: gameInviteDataSchema,
  game_started: gameStartedDataSchema,
  achievement_unlocked: achievementUnlockedDataSchema,
};

function validateNotificationData(
  type: NotificationType,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const schema = notificationDataSchemas[type];
  return schema.parse(data) as Record<string, unknown>;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class NotificationService {
  private readonly notifications: NotificationRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.notifications = new NotificationRepository(supabase);
  }

  /**
   * Récupère les notifications récentes d'un utilisateur.
   * Nettoie automatiquement les notifications de +30 jours (fire-and-forget).
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 30,
  ): Promise<ServiceResult<NotificationInfo[]>> {
    try {
      // Lazy cleanup — fire-and-forget, ne bloque pas la requête
      this.notifications.deleteOlderThan(30).catch(() => {});

      const rows = await this.notifications.findByUserId(userId, limit, page);
      const result: NotificationInfo[] = rows.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        data: row.data,
        isRead: row.is_read,
        createdAt: row.created_at,
      }));
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Récupère le nombre de notifications non lues.
   */
  async getUnreadCount(userId: string): Promise<ServiceResult<{ count: number }>> {
    try {
      const count = await this.notifications.countUnread(userId);
      return { success: true, data: { count } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Marque une notification comme lue.
   */
  async markAsRead(notificationId: string): Promise<ServiceResult<void>> {
    try {
      await this.notifications.markAsRead(notificationId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Marque toutes les notifications comme lues.
   */
  async markAllAsRead(userId: string): Promise<ServiceResult<void>> {
    try {
      await this.notifications.markAllAsRead(userId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Supprime une notification.
   */
  async delete(notificationId: string): Promise<ServiceResult<void>> {
    try {
      await this.notifications.delete(notificationId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Supprime les notifications de plus de 30 jours.
   */
  async deleteOld(): Promise<ServiceResult<{ deleted: number }>> {
    try {
      const deleted = await this.notifications.deleteOlderThan(30);
      return { success: true, data: { deleted } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  /**
   * Crée une notification.
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<ServiceResult<NotificationInfo>> {
    try {
      // Validate JSONB data against the schema for this notification type
      const validatedData = data ? validateNotificationData(type, data) : {};
      const row = await this.notifications.create(userId, type, title, body, validatedData);
      return {
        success: true,
        data: {
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          data: row.data,
          isRead: row.is_read,
          createdAt: row.created_at,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // ===========================================================================
  // Static helpers — appelés depuis les autres services
  // ===========================================================================

  /**
   * Notifie d'une demande d'amitié reçue.
   */
  static async notifyFriendRequestReceived(
    supabase: SupabaseClient<Database>,
    recipientId: string,
    senderPseudo: string,
    senderAvatarUrl: string | null,
    friendshipId: string,
  ): Promise<void> {
    const repo = new NotificationRepository(supabase);
    await repo.create(
      recipientId,
      "friend_request_received",
      `${senderPseudo} sent you a friend request`,
      "Accept or decline from the friends page.",
      { senderPseudo, senderAvatarUrl, friendshipId },
    ).catch((e) => console.error("[Notifications] notifyFriendRequestReceived failed:", e));
  }

  /**
   * Notifie qu'une demande d'amitié a été acceptée.
   */
  static async notifyFriendRequestAccepted(
    supabase: SupabaseClient<Database>,
    recipientId: string,
    accepterPseudo: string,
    accepterAvatarUrl: string | null,
  ): Promise<void> {
    const repo = new NotificationRepository(supabase);
    await repo.create(
      recipientId,
      "friend_request_accepted",
      `${accepterPseudo} accepted your friend request`,
      "You can now invite them to a game!",
      { senderPseudo: accepterPseudo, senderAvatarUrl: accepterAvatarUrl },
    ).catch((e) => console.error("[Notifications] notifyFriendRequestAccepted failed:", e));
  }

  /**
   * Notifie d'un message privé reçu (avec déduplication).
   */
  static async notifyMessageReceived(
    supabase: SupabaseClient<Database>,
    recipientId: string,
    senderPseudo: string,
    senderAvatarUrl: string | null,
    senderId: string,
  ): Promise<void> {
    const repo = new NotificationRepository(supabase);

    // Éviter le spam : ne pas créer si une notification non lue du même expéditeur existe
    const alreadyExists = await repo.hasUnread(recipientId, "message_received", { senderId });
    if (alreadyExists) return;

    await repo.create(
      recipientId,
      "message_received",
      `New message from ${senderPseudo}`,
      "Tap to read the conversation.",
      { senderId, senderPseudo, senderAvatarUrl },
    ).catch((e) => console.error("[Notifications] notifyMessageReceived failed:", e));
  }

  /**
   * Notifie d'une invitation à une partie.
   */
  static async notifyGameInvite(
    supabase: SupabaseClient<Database>,
    recipientId: string,
    senderPseudo: string,
    gameId: string,
    joinCode: string,
  ): Promise<void> {
    const repo = new NotificationRepository(supabase);
    await repo.create(
      recipientId,
      "game_invite_received",
      `${senderPseudo} invited you to a game`,
      `Join code: ${joinCode}`,
      { senderPseudo, gameId, joinCode },
    ).catch((e) => console.error("[Notifications] notifyGameInvite failed:", e));
  }

  /**
   * Notifie que la partie a commencé (matchmaking trouvé).
   */
  static async notifyGameStarted(
    supabase: SupabaseClient<Database>,
    recipientId: string,
    gameId: string,
  ): Promise<void> {
    const repo = new NotificationRepository(supabase);
    await repo.create(
      recipientId,
      "game_started",
      "Your game is starting!",
      "Tap to join the game now.",
      { gameId },
    ).catch((e) => console.error("[Notifications] notifyGameStarted failed:", e));
  }
}
