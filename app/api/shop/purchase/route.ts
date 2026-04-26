// =============================================================================
// API — POST /api/shop/purchase — Purchase a dice skin via Stripe Checkout
// =============================================================================

import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileRepository } from "@/lib/database/profile-repository";
import { UserSkinRepository } from "@/lib/database/user-skin-repository";
import { getSkinById } from "@/lib/skins/catalog";
import { errorResponse, successResponse } from "@/app/api/billing/helpers";

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Not authenticated.", 401);
  }

  let body: { skinId: string };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  const { skinId } = body;
  if (!skinId) {
    return errorResponse("skinId is required.", 400);
  }

  const skin = getSkinById(skinId);
  if (!skin) {
    return errorResponse("Skin not found.", 404);
  }

  if (skin.free) {
    return errorResponse("This skin is free and does not need to be purchased.", 400);
  }

  if (!skin.stripePriceId) {
    return errorResponse("This skin is not available for purchase.", 400);
  }

  try {
    // Check if user already owns this skin
    const skinRepo = new UserSkinRepository(supabase);
    const alreadyOwned = await skinRepo.userOwnsSkin(user.id, skinId);
    if (alreadyOwned) {
      return errorResponse("You already own this skin.", 400);
    }

    // Get or create Stripe customer
    const profileRepo = new ProfileRepository(supabase);
    const profile = await profileRepo.findById(user.id);
    let stripeCustomerId = profile?.stripe_customer_id ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await profileRepo.updateStripeCustomerId(user.id, stripeCustomerId);
    }

    const origin = new URL(request.url).origin;

    // Create one-time payment checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      line_items: [{ price: skin.stripePriceId, quantity: 1 }],
      allow_promotion_codes: true,
      // Recueil du consentement (CGV + renoncement exprès au droit de rétractation
      // — art. L.221-28, 13° du Code de la consommation, exécution immédiate du
      // contenu numérique).
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            "J'accepte les [Conditions Générales de Vente](https://www.dixo-game.com/legal/terms-of-sale) et je renonce expressément à mon droit de rétractation de 14 jours en raison de l'exécution immédiate du contenu numérique (déblocage instantané du skin).",
        },
      },
      success_url: `${origin}/skins?purchased=${skinId}`,
      cancel_url: `${origin}/shop`,
      metadata: {
        userId: user.id,
        type: "skin_purchase",
        skinId,
      },
    });

    return successResponse({ url: session.url });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Error creating checkout session.",
      500,
    );
  }
}
