// =============================================================================
// API — POST /api/billing/checkout — Créer une session Stripe Checkout
// =============================================================================

import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { withBillingAuth, errorResponse, successResponse } from "../helpers";

export async function POST(request: NextRequest) {
  const { user, profileRepo } = await withBillingAuth();
  if (!user || !profileRepo) {
    return errorResponse("Not authenticated.", 401);
  }

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!priceId) {
    return errorResponse("Stripe price ID not configured.", 500);
  }

  try {
    const profile = await profileRepo.findById(user.id);

    if (profile?.subscription === "premium" || profile?.subscription === "vip") {
      return errorResponse("You already have an active Premium subscription.", 400);
    }

    // Récupérer ou créer le customer Stripe
    let stripeCustomerId = profile?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await profileRepo.updateStripeCustomerId(user.id, stripeCustomerId);
    }

    // Dériver l'origine depuis la requête
    const origin = new URL(request.url).origin;

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/profile?upgraded=1`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId: user.id },
    });

    return successResponse({ url: session.url });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Error creating checkout session.",
      500,
    );
  }
}
