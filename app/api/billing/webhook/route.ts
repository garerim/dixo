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
import { UserSkinRepository } from "@/lib/database/user-skin-repository";
import { getPremiumSkins } from "@/lib/skins/catalog";

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
  const skinRepoForPremium = new UserSkinRepository(supabase);

  // Helpers for granting/revoking premium-exclusive skins
  const grantPremiumSkins = async (userId: string) => {
    for (const skin of getPremiumSkins()) {
      if (!skin.id) continue;
      try {
        await skinRepoForPremium.grantSkin(userId, skin.id);
      } catch (e) {
        console.error(`Failed to grant premium skin ${skin.id} to ${userId}:`, e);
      }
    }
  };
  const revokePremiumSkins = async (userId: string, resetDiceSkin: boolean) => {
    for (const skin of getPremiumSkins()) {
      if (!skin.id) continue;
      try {
        await skinRepoForPremium.revokeSkin(userId, skin.id);
        // If the user had this skin selected, reset to default
        if (resetDiceSkin) {
          const profile = await profileRepo.findById(userId);
          if (profile && profile.dice_skin === skin.id) {
            await profileRepo.update(userId, { dice_skin: null });
          }
        }
      } catch (e) {
        console.error(`Failed to revoke premium skin ${skin.id} from ${userId}:`, e);
      }
    }
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (!userId) break;

        // ── Skin purchase (one-time payment) ──
        if (session.mode === "payment" && session.metadata?.type === "skin_purchase") {
          const skinId = session.metadata.skinId;
          if (skinId) {
            const skinRepo = new UserSkinRepository(supabase);
            await skinRepo.grantSkin(userId, skinId, session.id);
          }
          break;
        }

        // ── Subscription purchase ──
        if (session.mode !== "subscription" || !session.subscription) break;

        // Récupérer les détails de l'abonnement pour la date d'expiration
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        ) as unknown as { current_period_end?: number };
        const expiresAt = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await profileRepo.updateSubscription(userId, "premium", expiresAt);

        // Grant the exclusive Premium skin(s)
        await grantPremiumSkins(userId);

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
          await grantPremiumSkins(profile.id);
        } else if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
          await profileRepo.updateSubscription(profile.id, "free", null);
          await revokePremiumSkins(profile.id, true);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const profile = await profileRepo.findByStripeCustomerId(customerId);
        if (!profile) break;

        await profileRepo.updateSubscription(profile.id, "free", null);
        await revokePremiumSkins(profile.id, true);
        break;
      }
    }
  } catch (err) {
    console.error(`Stripe webhook handler error [${event.type}]:`, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
