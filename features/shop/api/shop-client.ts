// =============================================================================
// FEATURE — Shop Client API
// =============================================================================

import type { ApiResponse } from "@/types/api";

export const shopClient = {
  /** Get IDs of skins owned by the current user */
  async getMySkins(): Promise<ApiResponse<{ skinIds: string[] }>> {
    const res = await fetch("/api/shop/my-skins", { method: "GET" });
    return res.json();
  },

  /** Purchase a skin — returns Stripe Checkout URL */
  async purchaseSkin(skinId: string): Promise<ApiResponse<{ url: string }>> {
    const res = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skinId }),
    });
    return res.json();
  },
};
