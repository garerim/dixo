"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { NotificationInfo } from "@/types/api";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";

// =============================================================================
// Types
// =============================================================================

interface NotificationContextType {
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

// =============================================================================
// Context
// =============================================================================

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  loadMore: async () => {},
  refresh: async () => {},
});

// =============================================================================
// Provider
// =============================================================================

export function NotificationProvider({ children }: { children: ReactNode }) {
  const state = useNotifications();

  return (
    <NotificationContext.Provider value={state}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
