// =============================================================================
// API — POST /api/billing/portal — Ouvrir le portail Stripe Customer
// =============================================================================

import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe/server";
import { withBillingAuth, errorResponse, successResponse } from "../helpers";

export async function POST(request: NextRequest) {
  const { user, profileRepo } = await withBillingAuth();
  if (!user || !profileRepo) {
    return errorResponse("Not authenticated.", 401);
  }

  try {
    const profile = await profileRepo.findById(user.id);

    if (!profile?.stripe_customer_id) {
      return errorResponse("No Stripe account found. Subscribe first.", 404);
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/profile`,
    });

    return successResponse({ url: session.url });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Error creating portal session.",
      500,
    );
  }
}
