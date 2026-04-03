// =============================================================================
// FEATURE — Messages privés
// =============================================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Send, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessages } from "../hooks/use-messages";
import { useAuth } from "@/components/providers/auth-provider";
import type { FriendInfo } from "@/types/api";

// =============================================================================
// Date formatting
// =============================================================================

function formatMessageDate(
  dateStr: string,
  t: ReturnType<typeof useTranslations<"messages">>,
): string {
  const date = new Date(dateStr);
  const now = new Date();

  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Today
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return t("today", { time });

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return t("yesterday", { time });

  // Older
  const dayStr = date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  return t("date", { date: dayStr, time });
}

// =============================================================================
// Component
// =============================================================================

interface MessagesProps {
  friend: FriendInfo | null;
}

export function Messages({ friend }: MessagesProps) {
  const t = useTranslations("messages");
  const { user } = useAuth();
  const [messageContent, setMessageContent] = useState("");
  const { messages, isLoading, actions } = useMessages(friend?.id ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

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
          <p className="text-muted-foreground">{t("selectFriend")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="shrink-0 border-b">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={friend.avatarUrl ?? undefined} />
            <AvatarFallback>{friend.pseudo.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-base">{friend.pseudo}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {/* Messages area */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto px-4 py-4 scrollbar-thin"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {t("noMessages")}
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
                      <Avatar className="size-8 shrink-0">
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
                        <p className="text-[10px] text-muted-foreground">
                          {formatMessageDate(msg.createdAt, t)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex size-8 items-center justify-center rounded-full border bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronDown className="size-4" />
            </button>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder={t("placeholder")}
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
