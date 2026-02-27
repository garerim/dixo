// =============================================================================
// FEATURE — Hook useMessages
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { PrivateMessage } from "@/types/api";
import { messagesClient } from "../api/messages-client";

interface UseMessagesReturn {
  messages: PrivateMessage[];
  isLoading: boolean;
  error: string | null;
  actions: {
    sendMessage: (receiverId: string, content: string) => Promise<boolean>;
    loadConversation: (friendId: string) => Promise<void>;
    markAsRead: (friendId: string) => Promise<void>;
  };
}

export function useMessages(friendId: string | null): UseMessagesReturn {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversation = useCallback(async (targetFriendId: string) => {
    if (!targetFriendId) return;
    setIsLoading(true);
    setError(null);
    const result = await messagesClient.getConversation(targetFriendId);
    if (result.success && result.data) {
      setMessages(result.data);
      // Marquer comme lus
      await messagesClient.markAsRead(targetFriendId);
    } else {
      setError(result.error ?? "Impossible de charger la conversation.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (friendId) {
      loadConversation(friendId);
      // Polling pour les nouveaux messages
      pollingRef.current = setInterval(() => {
        loadConversation(friendId);
      }, 3000); // Toutes les 3 secondes
    } else {
      setMessages([]);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [friendId, loadConversation]);

  const sendMessage = useCallback(
    async (receiverId: string, content: string): Promise<boolean> => {
      const result = await messagesClient.sendMessage({ receiverId, content });
      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data!]);
        return true;
      } else {
        toast.error(result.error ?? "Impossible d'envoyer le message.");
        return false;
      }
    },
    [],
  );

  const markAsRead = useCallback(async (targetFriendId: string) => {
    await messagesClient.markAsRead(targetFriendId);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.senderId === targetFriendId ? { ...msg, isRead: true } : msg,
      ),
    );
  }, []);

  return {
    messages,
    isLoading,
    error,
    actions: {
      sendMessage,
      loadConversation,
      markAsRead,
    },
  };
}
