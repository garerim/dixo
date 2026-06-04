// =============================================================================
// INFRASTRUCTURE — Client Stripe (côté serveur uniquement)
// =============================================================================

import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Instancie (une seule fois) le client Stripe. Throw uniquement si la clé est
 * absente AU MOMENT DE L'APPEL — pas à l'import du module.
 */
function getStripe(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY manquante. Ajoutez-la dans .env.local.");
    }
    _stripe = new Stripe(apiKey, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

/**
 * Proxy lazy : conserve l'API `stripe.xxx` pour tous les consommateurs, mais
 * n'instancie le client (et ne throw) qu'au premier accès réel à l'exécution.
 *
 * Pourquoi : `next build` collecte les données de chaque route en important ses
 * modules. Un throw au niveau module (clé absente) cassait donc le build dans un
 * environnement où la clé n'est pas injectée (ex. env `preview` tiré en CI).
 * Avec ce Proxy, le build ne déclenche jamais l'instanciation ; seul un appel
 * runtime (ex. checkout) le fait.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripe();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
