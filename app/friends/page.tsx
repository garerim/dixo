// =============================================================================
// PAGE — Amis et Messages
// =============================================================================

"use client";

import { useState } from "react";
import { ArrowLeft, MessageSquare, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FriendsList } from "@/features/friends/components/friends-list";
import { Messages } from "@/features/messages/components/messages";
import type { FriendInfo } from "@/types/api";

export default function FriendsPage() {
  const router = useRouter();
  const [selectedFriend, setSelectedFriend] = useState<FriendInfo | null>(null);

  return (
    <div className="flex min-h-svh flex-col">
      {/* ─── Header ─── */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Amis</span>
        </div>
      </header>

      {/* ─── Contenu ─── */}
      <main className="flex flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* ── Liste des amis ── */}
        <div className="w-full lg:max-w-md">
          <FriendsList onSelectFriend={setSelectedFriend} />
        </div>

        {/* ── Messages ── */}
        <div className="flex-1">
          <Messages friend={selectedFriend} />
        </div>
      </main>
    </div>
  );
}
