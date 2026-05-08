// =============================================================================
// FEATURE — Hook useBilling
// =============================================================================

"use client";

import { useState } from "react";
import { billingClient } from "../api/billing-client";

export function useBilling() {
  const [isLoading, setIsLoading] = useState(false);

  async function checkout() {
    setIsLoading(true);
    const result = await billingClient.createCheckout();
    setIsLoading(false);

    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
    }
    return result;
  }

  async function openPortal() {
    setIsLoading(true);
    const result = await billingClient.createPortalSession();
    setIsLoading(false);

    if (result.success && result.data?.url) {
      window.location.href = result.data.url;
    }
    return result;
  }

  async function cancelSubscription() {
    setIsLoading(true);
    const result = await billingClient.cancelSubscription();
    setIsLoading(false);
    return result;
  }

  return { isLoading, checkout, openPortal, cancelSubscription };
}
