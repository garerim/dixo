// =============================================================================
// FEATURE — Hook useMessages
// =============================================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { PrivateMessage } from "@/types/api";
import { messagesClient } from "../api/messages-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { useSound } from "@/components/providers/sound-provider";

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
  const { user } = useAuth();
  const { playSound } = useSound();
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null>(null);

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
    if (!friendId || !user) {
      setMessages([]);
      return;
    }

    // Charger la conversation initiale
    loadConversation(friendId);

    // Configurer Realtime pour les nouveaux messages
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`private_messages:${user.id}:${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `sender_id=eq.${friendId}`,
        },
        async (payload) => {
          // Nouveau message reçu de l'ami
          const newMessage = payload.new as any;
          if (newMessage.receiver_id === user.id) {
            // Récupérer les infos du profil de l'expéditeur
            const { data: profile } = await supabase
              .from("profiles")
              .select("pseudo, avatar_url")
              .eq("id", newMessage.sender_id)
              .single();

            if (profile) {
              const message: PrivateMessage = {
                id: newMessage.id,
                senderId: newMessage.sender_id,
                senderPseudo: profile.pseudo,
                senderAvatarUrl: profile.avatar_url,
                receiverId: newMessage.receiver_id,
                content: newMessage.content,
                isRead: false,
                createdAt: newMessage.created_at,
              };
              setMessages((prev) => {
                // Éviter les doublons
                if (prev.some((m) => m.id === message.id)) return prev;
                // Play sound for incoming messages
                playSound("message");
                return [...prev, message];
              });
              // Marquer comme lu automatiquement
              await messagesClient.markAsRead(friendId);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `receiver_id=eq.${friendId}`,
        },
        async (payload) => {
          // Message envoyé par l'utilisateur actuel vers l'ami
          const newMessage = payload.new as any;
          if (newMessage.sender_id === user.id) {
            // Récupérer les infos du profil de l'utilisateur actuel
            const { data: profile } = await supabase
              .from("profiles")
              .select("pseudo, avatar_url")
              .eq("id", user.id)
              .single();

            if (profile) {
              const message: PrivateMessage = {
                id: newMessage.id,
                senderId: newMessage.sender_id,
                senderPseudo: profile.pseudo,
                senderAvatarUrl: profile.avatar_url,
                receiverId: newMessage.receiver_id,
                content: newMessage.content,
                isRead: true, // Les messages qu'on envoie sont considérés comme lus
                createdAt: newMessage.created_at,
              };
              setMessages((prev) => {
                // Éviter les doublons
                if (prev.some((m) => m.id === message.id)) return prev;
                return [...prev, message];
              });
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "private_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          // Mise à jour du statut "lu" d'un message
          const updatedMessage = payload.new as any;
          if (updatedMessage.sender_id === friendId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMessage.id
                  ? { ...msg, isRead: updatedMessage.is_read }
                  : msg,
              ),
            );
          }
        },
      )
      .subscribe();

    channelRef.current = channel as any;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [friendId, user, loadConversation]);

  const sendMessage = useCallback(
    async (receiverId: string, content: string): Promise<boolean> => {
      const result = await messagesClient.sendMessage({ receiverId, content });
      if (result.success) {
        // Le message sera ajouté automatiquement via Realtime
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
