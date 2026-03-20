// =============================================================================
// INFRASTRUCTURE — Notification Repository
// =============================================================================
// Couche d'accès aux données pour les notifications in-app.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NotificationRow, NotificationType } from "@/types/database";

export class NotificationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Crée une notification.
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, unknown>,
  ): Promise<NotificationRow> {
    const { data: row, error } = await this.supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        body: body ?? null,
        data: data ?? {},
        is_read: false,
      })
      .select("*")
      .single();

    if (error || !row) {
      throw new Error(`Erreur création notification: ${error?.message ?? "Données manquantes"}`);
    }

    return row;
  }

  /**
   * Récupère les notifications récentes d'un utilisateur.
   */
  async findByUserId(
    userId: string,
    limit: number = 30,
    page: number = 1,
  ): Promise<NotificationRow[]> {
    const offset = (page - 1) * limit;
    const { data, error } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) return [];
    return data;
  }

  /**
   * Compte les notifications non lues.
   */
  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) return 0;
    return count ?? 0;
  }

  /**
   * Marque une notification comme lue.
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      throw new Error(`Erreur marquage notification lue: ${error.message}`);
    }
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues.
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      throw new Error(`Erreur marquage toutes notifications lues: ${error.message}`);
    }
  }

  /**
   * Supprime une notification par son ID.
   */
  async delete(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      throw new Error(`Erreur suppression notification: ${error.message}`);
    }
  }

  /**
   * Supprime les notifications de plus de `days` jours.
   * Retourne le nombre de lignes supprimées.
   */
  async deleteOlderThan(days: number = 30): Promise<number> {
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data, error } = await this.supabase
      .from("notifications")
      .delete()
      .lt("created_at", cutoff)
      .select("id");

    if (error) {
      throw new Error(`Erreur nettoyage notifications: ${error.message}`);
    }
    return data?.length ?? 0;
  }

  /**
   * Vérifie s'il existe déjà une notification non lue du même type avec les mêmes données.
   * Utile pour éviter le spam de notifications (ex: messages).
   */
  async hasUnread(
    userId: string,
    type: NotificationType,
    dataFilter: Record<string, unknown>,
  ): Promise<boolean> {
    let query = this.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", type)
      .eq("is_read", false);

    // Filter by JSONB data fields
    for (const [key, value] of Object.entries(dataFilter)) {
      query = query.eq(`data->>${key}` as never, String(value));
    }

    const { count } = await query;
    return (count ?? 0) > 0;
  }
}
