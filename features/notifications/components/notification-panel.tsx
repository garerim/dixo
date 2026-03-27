"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  UserPlus,
  UserCheck,
  MessageSquare,
  Dice5,
  Swords,
  CheckCheck,
  Bell,
  X,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationContext } from "@/components/providers/notification-provider";
import type { NotificationInfo } from "@/types/api";
import type { NotificationType } from "@/types/database";

const ICONS: Record<NotificationType, React.ReactNode> = {
  friend_request_received: <UserPlus className="size-4 text-blue-500" />,
  friend_request_accepted: <UserCheck className="size-4 text-green-500" />,
  message_received: <MessageSquare className="size-4 text-purple-500" />,
  game_invite_received: <Dice5 className="size-4 text-yellow-500" />,
  game_started: <Swords className="size-4 text-primary" />,
  achievement_unlocked: <Trophy className="size-4 text-yellow-500" />,
};

function timeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function NotificationPanel() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotificationContext();
  const router = useRouter();

  function handleClick(notification: NotificationInfo) {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case "friend_request_received":
      case "friend_request_accepted":
        router.push("/friends");
        break;
      case "message_received": {
        const senderId = notification.data.senderId as string | undefined;
        if (senderId) {
          router.push(`/friends?chat=${senderId}`);
        } else {
          router.push("/friends");
        }
        break;
      }
      case "game_invite_received":
      case "game_started": {
        const gameId = notification.data.gameId as string | undefined;
        if (gameId) {
          router.push(`/game/${gameId}`);
        }
        break;
      }
      case "achievement_unlocked":
        router.push("/profile");
        break;
    }
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteNotification(id);
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
            onClick={markAllAsRead}
          >
            <CheckCheck className="size-3" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            <Bell className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="group relative"
              >
                <button
                  onClick={() => handleClick(notification)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {ICONS[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {notification.body}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="mt-2 flex-shrink-0">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                  )}
                </button>

                {/* Delete button — visible on hover */}
                <button
                  onClick={(e) => handleDelete(e, notification.id)}
                  className="absolute right-2 top-2 hidden rounded-sm p-0.5 text-muted-foreground hover:text-foreground group-hover:block"
                  aria-label="Delete notification"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="border-t p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? tc("loading") : t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
