// =============================================================================
// FEATURE — Chat de partie
// =============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, MessageSquare, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGameChat } from "../hooks/use-game-chat";
import { useAuth } from "@/components/providers/auth-provider";
import type { GameMessage } from "@/types/api";
import { ReportDialog } from "@/features/reports/components/report-dialog";

interface GameChatProps {
  gameId: string | null;
  className?: string;
  hideHeader?: boolean;
  fullHeight?: boolean;
}

export function GameChat({ gameId, className, hideHeader = false, fullHeight = false }: GameChatProps) {
  const t = useTranslations("game.chat");
  const { user } = useAuth();
  const [messageContent, setMessageContent] = useState("");
  const { messages, isLoading, actions } = useGameChat(gameId ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [reportTarget, setReportTarget] = useState<GameMessage | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageContent.trim()) return;
    const success = await actions.sendMessage(messageContent.trim());
    if (success) {
      setMessageContent("");
    }
  };

  if (isCollapsed) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(false)}
        className={className}
      >
        <MessageSquare className="size-4 mr-2" />
        {t("titleWithCount", { count: messages.length })}
      </Button>
    );
  }

  return (
    <Card className={`flex ${fullHeight ? 'h-full max-h-[calc(100vh-100px)]' : 'h-[300px]'} flex-col overflow-hidden ${className}`}>
      {!hideHeader && (
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3 shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="size-4" />
            {t("title")}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsCollapsed(true)}
          >
            ×
          </Button>
        </CardHeader>
      )}
      <CardContent className="flex flex-1 flex-col gap-2 p-0 overflow-hidden min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
        >
          {isLoading && messages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("loading")}
            </p>
          ) : messages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwn = msg.userId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`group flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={msg.userAvatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {msg.userPseudo.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"} max-w-[75%]`}>
                      <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-medium text-muted-foreground">
                          {msg.userPseudo}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className={`flex items-center gap-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`rounded-lg px-3 py-2 text-sm break-words ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {!isOwn && (
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                            onClick={() => {
                              setReportTarget(msg);
                              setReportOpen(true);
                            }}
                            title={t("report")}
                          >
                            <Flag className="size-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t p-3 flex-shrink-0">
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
              maxLength={500}
              className="text-sm"
            />
            <Button onClick={handleSend} disabled={!messageContent.trim()} size="icon">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {reportTarget && (
        <ReportDialog
          open={reportOpen}
          onOpenChange={(open) => {
            setReportOpen(open);
            if (!open) setReportTarget(null);
          }}
          reportType="message"
          targetId={reportTarget.id}
          targetLabel={`message from ${reportTarget.userPseudo}`}
        />
      )}
    </Card>
  );
}
