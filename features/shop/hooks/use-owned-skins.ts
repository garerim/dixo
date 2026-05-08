"use client";

import { useState, useCallback, useEffect } from "react";
import { shopClient } from "../api/shop-client";

export function useOwnedSkins() {
  const [ownedSkinIds, setOwnedSkinIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const result = await shopClient.getMySkins();
    if (result.success && result.data) {
      setOwnedSkinIds(result.data.skinIds);
    }
    setIsLoading(false);
  }, []);

  // Client-only fetch on mount — avoids SSR crash from fetch("/api/...")
  // with a relative URL on the server (Node fetch rejects relative URLs).
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ownedSkinIds, isLoading, refresh };
}
