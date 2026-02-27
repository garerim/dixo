// =============================================================================
// FEATURE — Client API pour les amis
// =============================================================================

import type {
  ApiResponse,
  FriendInfo,
  AddFriendRequest,
  RespondToFriendRequest,
  FriendsListResponse,
  AddFriendResponse,
  RespondToFriendRequestResponse,
  RemoveFriendResponse,
} from "@/types/api";

const BASE_URL = "/api/friends";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error ?? `Erreur HTTP ${response.status}` };
    }

    return data;
  } catch {
    return { success: false, error: "Erreur réseau." };
  }
}

export const friendsClient = {
  /** Récupère la liste des amis */
  getFriends(): Promise<FriendsListResponse> {
    return fetchApi("/list", { method: "GET" });
  },

  /** Ajoute un ami */
  addFriend(data: AddFriendRequest): Promise<AddFriendResponse> {
    return fetchApi("/add", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Répond à une demande d'amitié */
  respondToRequest(data: RespondToFriendRequest): Promise<RespondToFriendRequestResponse> {
    return fetchApi("/respond", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Supprime un ami */
  removeFriend(data: { friendshipId: string }): Promise<RemoveFriendResponse> {
    return fetchApi("/remove", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
} as const;
