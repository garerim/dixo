// =============================================================================
// API — POST /api/billing/webhook — Stripe Webhooks
// =============================================================================
// Ce handler ne nécessite pas d'authentification Supabase.
// Il utilise le client admin pour mettre à jour les profils (bypass RLS).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { ProfileRepository } from "@/lib/database/profile-repository";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret." }, { status: 400 });
  }

  // Lire le body en raw pour la vérification de signature
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown"}` },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const profileRepo = new ProfileRepository(supabase);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) break;

        const userId = session.metadata?.userId;
        if (!userId) break;

        // Récupérer les détails de l'abonnement pour la date d'expiration
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        ) as unknown as { current_period_end?: number };
        const expiresAt = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await profileRepo.updateSubscription(userId, "premium", expiresAt);

        // Associer le customer_id si pas encore fait
        if (session.customer) {
          await profileRepo.updateStripeCustomerId(userId, session.customer as string);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number };
        const customerId = subscription.customer as string;

        const profile = await profileRepo.findByStripeCustomerId(customerId);
        if (!profile) break;

        const expiresAt = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;
        const isActive = ["active", "trialing"].includes(subscription.status);

        if (isActive) {
          await profileRepo.updateSubscription(profile.id, "premium", expiresAt);
        } else if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
          await profileRepo.updateSubscription(profile.id, "free", null);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const profile = await profileRepo.findByStripeCustomerId(customerId);
        if (!profile) break;

        await profileRepo.updateSubscription(profile.id, "free", null);
        break;
      }
    }
  } catch (err) {
    console.error(`Stripe webhook handler error [${event.type}]:`, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
