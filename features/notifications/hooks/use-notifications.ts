// =============================================================================
// FEATURE — Hook useNotifications
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { NotificationInfo } from "@/types/api";
import { notificationsClient } from "../api/notifications-client";
import { subscribeToNotifications } from "@/lib/realtime/notification-channel";
import { useAuth } from "@/components/providers/auth-provider";

interface UseNotificationsReturn {
  notifications: NotificationInfo[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const TOAST_TYPES = new Set([
  "friend_request_received",
  "friend_request_accepted",
  "message_received",
  "game_invite_received",
  "game_started",
]);

const PAGE_SIZE = 30;

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationInfo[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const unsubRef = useRef<(() => void) | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    pageRef.current = 1;
    const [listResult, countResult] = await Promise.all([
      notificationsClient.getNotifications(1, PAGE_SIZE),
      notificationsClient.getUnreadCount(),
    ]);

    if (listResult.success && listResult.data) {
      setNotifications(listResult.data);
      setHasMore(listResult.data.length >= PAGE_SIZE);
    }
    if (countResult.success && countResult.data) {
      setUnreadCount(countResult.data.count);
    }
    setIsLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    const nextPage = pageRef.current + 1;
    const result = await notificationsClient.getNotifications(nextPage, PAGE_SIZE);
    if (result.success && result.data) {
      pageRef.current = nextPage;
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = result.data!.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });
      setHasMore(result.data.length >= PAGE_SIZE);
    }
    setIsLoading(false);
  }, [isLoading, hasMore]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    // Fetch notifications on mount / user change
    (async () => {
      pageRef.current = 1;
      const [listResult, countResult] = await Promise.all([
        notificationsClient.getNotifications(1, PAGE_SIZE),
        notificationsClient.getUnreadCount(),
      ]);
      if (cancelled) return;
      if (listResult.success && listResult.data) {
        setNotifications(listResult.data);
        setHasMore(listResult.data.length >= PAGE_SIZE);
      }
      if (countResult.success && countResult.data) {
        setUnreadCount(countResult.data.count);
      }
      setIsLoading(false);
    })();

    // Subscribe to realtime notifications
    unsubRef.current = subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((prev) => prev + 1);

      if (TOAST_TYPES.has(notification.type)) {
        toast.info(notification.title);
      }
    });

    return () => {
      cancelled = true;
      unsubRef.current?.();
      unsubRef.current = null;
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(true);
    };
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const result = await notificationsClient.markAsRead(id);
    if (!result.success) {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const previousNotifications = notifications;
    const previousCount = unreadCount;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const result = await notificationsClient.markAllAsRead();
    if (!result.success) {
      // Revert on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
    }
  }, [notifications, unreadCount]);

  const deleteNotification = useCallback(async (id: string) => {
    const previous = notifications;
    const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;

    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));

    const result = await notificationsClient.delete(id);
    if (!result.success) {
      // Revert on failure
      setNotifications(previous);
      if (wasUnread) setUnreadCount((prev) => prev + 1);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh: loadNotifications,
  };
}
