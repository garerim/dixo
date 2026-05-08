// =============================================================================
// FEATURE — Billing Client API
// =============================================================================

import type { ApiResponse } from "@/types/api";

export const billingClient = {
  /**
   * Crée une session Stripe Checkout et retourne l'URL de redirection.
   */
  async createCheckout(): Promise<ApiResponse<{ url: string }>> {
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    return res.json();
  },

  /**
   * Crée une session Stripe Customer Portal et retourne l'URL de redirection.
   */
  async createPortalSession(): Promise<ApiResponse<{ url: string }>> {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    return res.json();
  },

  /**
   * Résilie l'abonnement Premium à la fin de la période en cours.
   * (Conforme L.215-1-1 — résiliation directe, sans passer par Stripe.)
   */
  async cancelSubscription(): Promise<
    ApiResponse<{ alreadyScheduled: boolean; cancelAt: number | null }>
  > {
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    return res.json();
  },
};
