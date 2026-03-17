"use client";

import { useState, useCallback } from "react";
import { shopClient } from "../api/shop-client";

export function useOwnedSkins() {
  const [ownedSkinIds, setOwnedSkinIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const result = await shopClient.getMySkins();
    if (result.success && result.data) {
      setOwnedSkinIds(result.data.skinIds);
    }
    setIsLoading(false);
  }, []);

  // Lazy initialization on first render
  if (!initialized) {
    setInitialized(true);
    refresh();
  }

  return { ownedSkinIds, isLoading, refresh };
}
