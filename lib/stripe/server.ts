// =============================================================================
// INFRASTRUCTURE — Client Stripe (côté serveur uniquement)
// =============================================================================

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY manquante. Ajoutez-la dans .env.local.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});
