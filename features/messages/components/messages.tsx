// =============================================================================
// FEATURE — Messages privés
// =============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages } from "../hooks/use-messages";
import { useAuth } from "@/components/providers/auth-provider";
import type { FriendInfo } from "@/types/api";

interface MessagesProps {
  friend: FriendInfo | null;
}

export function Messages({ friend }: MessagesProps) {
  const { user } = useAuth();
  const [messageContent, setMessageContent] = useState("");
  const { messages, isLoading, actions } = useMessages(friend?.id ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!friend || !messageContent.trim()) return;
    const success = await actions.sendMessage(friend.id, messageContent.trim());
    if (success) {
      setMessageContent("");
    }
  };

  if (!friend) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Sélectionnez un ami pour commencer à discuter</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-[500px] flex-col lg:h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={friend.avatarUrl ?? undefined} />
            <AvatarFallback>{friend.pseudo.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{friend.pseudo}</CardTitle>
            <CardDescription>
              {friend.isOnline ? "En ligne" : "Hors ligne"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 p-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Aucun message. Commencez la conversation !
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="size-8">
                      <AvatarImage src={msg.senderAvatarUrl ?? undefined} />
                      <AvatarFallback>
                        {msg.senderPseudo.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : ""}`}>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Tapez un message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              maxLength={1000}
            />
            <Button onClick={handleSend} disabled={!messageContent.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
