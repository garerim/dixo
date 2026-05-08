// =============================================================================
// API — POST /api/billing/cancel — Résilier l'abonnement Premium en 2 clics
// =============================================================================
// Conformité art. L.215-1-1 du Code de la consommation (loi du 16 nov. 2022,
// décret n° 2023-182 — résiliation aussi facile que la souscription, en 2 clics
// max, sans passer par un service tiers).
// =============================================================================

import { stripe } from "@/lib/stripe/server";
import { withBillingAuth, errorResponse, successResponse } from "../helpers";

export async function POST() {
  const { user, profileRepo } = await withBillingAuth();
  if (!user || !profileRepo) {
    return errorResponse("Not authenticated.", 401);
  }

  try {
    const profile = await profileRepo.findById(user.id);

    if (!profile?.stripe_customer_id) {
      return errorResponse("No active subscription found.", 404);
    }

    // Récupérer l'abonnement actif (ou en trial) du customer
    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "all",
      limit: 10,
    });

    const activeSub = subs.data.find((s) =>
      ["active", "trialing", "past_due"].includes(s.status),
    );

    if (!activeSub) {
      return errorResponse("No active subscription to cancel.", 404);
    }

    // L'API Stripe 2026-02-25.clover a déplacé `current_period_end` au niveau
    // SubscriptionItem ; on cast pour rester compatible avec le legacy field
    // au runtime (cf. webhook handler qui fait pareil).
    const periodEnd =
      (activeSub as unknown as { current_period_end?: number })
        .current_period_end ?? null;

    // Si déjà programmé pour annulation : no-op
    if (activeSub.cancel_at_period_end) {
      return successResponse({
        alreadyScheduled: true,
        cancelAt: periodEnd,
      });
    }

    // Annulation à la fin de la période payée (l'utilisateur garde l'accès
    // Premium jusqu'à expiration — voir CGV art. 7).
    const updated = await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: true,
    });

    return successResponse({
      alreadyScheduled: false,
      cancelAt:
        (updated as unknown as { current_period_end?: number })
          .current_period_end ?? null,
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Error cancelling subscription.",
      500,
    );
  }
}
