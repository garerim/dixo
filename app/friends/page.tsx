// =============================================================================
// PAGE — Amis et Messages
// =============================================================================

"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquare, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FriendsList } from "@/features/friends/components/friends-list";
import { Messages } from "@/features/messages/components/messages";
import type { FriendInfo } from "@/types/api";

export default function FriendsPage() {
  const router = useRouter();
  const t = useTranslations("friends");
  const [selectedFriend, setSelectedFriend] = useState<FriendInfo | null>(null);

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* ─── Header ─── */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">{t("title")}</span>
        </div>
      </header>

      {/* ─── Contenu ─── */}
      <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* ── Liste des amis ── */}
        <div className="w-full shrink-0 overflow-y-auto lg:max-w-md lg:shrink lg:overflow-y-auto">
          <FriendsList onSelectFriend={setSelectedFriend} />
        </div>

        {/* ── Messages ── */}
        <div className="min-h-0 flex-1">
          <Messages friend={selectedFriend} />
        </div>
      </main>
    </div>
  );
}
