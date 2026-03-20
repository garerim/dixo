// =============================================================================
// REALTIME — Canal de notifications
// =============================================================================
// Abonnement aux nouvelles notifications via Supabase Realtime.
// =============================================================================

import type { NotificationInfo } from "@/types/api";
import type { NotificationRow } from "@/types/database";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function rowToNotification(row: NotificationRow): NotificationInfo {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    data: row.data,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * S'abonne aux nouvelles notifications d'un utilisateur.
 * Retourne une fonction de cleanup.
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: NotificationInfo) => void,
): () => void {
  const supabase = getSupabaseBrowserClient();

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as NotificationRow;
        onNotification(rowToNotification(row));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
