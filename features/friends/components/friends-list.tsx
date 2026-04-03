// =============================================================================
// FEATURE — Liste des amis
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, UserPlus, MessageSquare, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFriends } from "../hooks/use-friends";
import { FriendProfileModal } from "./friend-profile-modal";
import { profileClient } from "@/features/profile/api/profile-client";
import { useAuth } from "@/components/providers/auth-provider";
import type { FriendInfo, PublicProfile } from "@/types/api";

interface FriendsListProps {
  onSelectFriend?: (friend: FriendInfo) => void;
  showAddFriend?: boolean;
}

export function FriendsList({ onSelectFriend, showAddFriend = true }: FriendsListProps) {
  const t = useTranslations("friends");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const { friends, isLoading, actions } = useFriends();
  const [selectedFriend, setSelectedFriend] = useState<FriendInfo | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Recherche d'utilisateurs
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const acceptedFriends = friends.filter((f) => f.status === "accepted");
  const pendingRequests = friends.filter((f) => f.status === "pending" && !f.isRequester);
  const pendingSent = friends.filter((f) => f.status === "pending" && f.isRequester);
  const allFriendIds = new Set(friends.map((f) => f.id));

  const filteredFriends = acceptedFriends.filter((f) =>
    f.pseudo.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Recherche d'utilisateurs par pseudo
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const result = await profileClient.searchProfiles(query, 10);
    if (result.success && result.data) {
      // Exclure soi-même et les utilisateurs déjà amis/en attente
      const friendIdsSet = new Set(friends.map((f) => f.id));
      const filtered = result.data.filter(
        (profile) => profile.id !== user?.id && !friendIdsSet.has(profile.id),
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
    setIsSearching(false);
  }, [user?.id, friends]);

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchUsers]);

  const handleViewProfile = (friend: FriendInfo) => {
    setSelectedFriend(friend);
    setShowProfileModal(true);
  };

  const handleAddFriend = async (userId: string) => {
    const success = await actions.addFriend(userId);
    if (success) {
      setSearchInput("");
      setSearchResults([]);
    }
  };

  const isAlreadyFriend = (userId: string) => allFriendIds.has(userId);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Ajouter un ami ── */}
      {showAddFriend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4" />
              {t("addFriend")}
            </CardTitle>
            <CardDescription>
              {t("searchDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Résultats de recherche */}
              {searchInput.length >= 2 && (
                <div className="space-y-2">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {t("noUserFound")}
                      <br />
                      <span className="text-xs">
                        {t("alreadyFriendHint")}
                      </span>
                    </p>
                  ) : (
                    searchResults.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={profile.avatarUrl ?? undefined} />
                            <AvatarFallback>
                              {profile.pseudo.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.pseudo}</p>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={profile.isOnline ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {profile.isOnline ? tc("online") : tc("offline")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                1v1: {profile.elo1v1} • 4p: {profile.elo4p}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddFriend(profile.id)}
                          disabled={isAlreadyFriend(profile.id)}
                        >
                          <UserPlus className="size-4 mr-1" />
                          {isAlreadyFriend(profile.id) ? t("alreadyFriend") : t("add")}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pending requests ── */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("receivedRequests")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend.avatarUrl ?? undefined} />
                    <AvatarFallback>{friend.pseudo.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{friend.pseudo}</p>
                    <p className="text-xs text-muted-foreground">{t("pending")}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="hidden sm:inline-flex"
                    onClick={() =>
                      actions.respondToRequest(friend.friendshipId, true)
                    }
                  >
                    {t("accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden sm:inline-flex"
                    onClick={() =>
                      actions.respondToRequest(friend.friendshipId, false)
                    }
                  >
                    {t("decline")}
                  </Button>
                  <Button
                    size="icon"
                    className="sm:hidden size-8"
                    onClick={() =>
                      actions.respondToRequest(friend.friendshipId, true)
                    }
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="sm:hidden size-8"
                    onClick={() =>
                      actions.respondToRequest(friend.friendshipId, false)
                    }
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Friends list ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("myFriends", { count: acceptedFriends.length })}</CardTitle>
          <CardDescription>
            {pendingSent.length > 0 && t("pendingRequests", { count: pendingSent.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Input
                placeholder={t("searchFriend")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              {filteredFriends.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  {searchQuery ? t("noFriendFound") : t("noFriendsYet")}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friend.avatarUrl ?? undefined} />
                          <AvatarFallback>{friend.pseudo.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.pseudo}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProfile(friend)}
                        >
                          {t("profileAction")}
                        </Button>
                        {onSelectFriend && (
                          <Button
                            size="sm"
                            onClick={() => onSelectFriend(friend)}
                          >
                            <MessageSquare className="size-4 mr-1" />
                            {t("message")}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <FriendProfileModal
        friend={selectedFriend}
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
    </div>
  );
}
