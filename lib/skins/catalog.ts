
// =============================================================================
// Skin Catalog — Single source of truth for all dice skins
// =============================================================================
// Add new skins here. The `id` must match the folder name in /public/dices-skins/.
// Set `priceId` to the Stripe Price ID for purchasable skins.
// =============================================================================

export interface SkinDefinition {
  /** Unique ID — matches folder name in /public/dices-skins/ (null = default) */
  id: string | null;
  /** Display name (English, not translated) */
  name: string;
  /** i18n key for the short description (under "skins" namespace) */
  descriptionKey: string;
  /** Preview image path (null = render default DiceFace) */
  preview: string | null;
  /** Price in euros (0 = free / included) */
  price: number;
  /** Stripe Price ID for one-time purchase (null = free skin) */
  stripePriceId: string | null;
  /** If true, everyone owns this skin by default */
  free: boolean;
  /** If false, skin can only be earned (e.g. tournament reward), not purchased */
  purchasable: boolean;
  /** If true, skin is exclusively granted to Premium subscribers */
  premiumOnly?: boolean;
}

export const SKIN_CATALOG: SkinDefinition[] = [
  {
    id: null,
    name: "Classic",
    descriptionKey: "desc_classic",
    preview: null,
    price: 0,
    stripePriceId: null,
    free: true,
    purchasable: true,
  },
  {
    id: "premium-royal",
    name: "Royal Premium",
    descriptionKey: "desc_premium-royal",
    preview: "/dices-skins/premium-royal/dice-5.png",
    price: 0,
    stripePriceId: null,
    free: false,
    purchasable: false,
    premiumOnly: true,
  },
  {
    id: "gold-ruby",
    name: "Gold Ruby",
    descriptionKey: "desc_gold-ruby",
    preview: "/dices-skins/gold-ruby/dice-5.png",
    price: 2.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SKIN_GOLD_RUBY_PRICE_ID ?? null,
    free: false,
    purchasable: true,
  },
  {
    id: "star-night",
    name: "Star Night",
    descriptionKey: "desc_star-night",
    preview: "/dices-skins/star-night/dice-5.png",
    price: 2.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SKIN_STAR_NIGHT_PRICE_ID ?? null,
    free: false,
    purchasable: true,
  },
  {
    id: "green-jade",
    name: "Green Jade",
    descriptionKey: "desc_green-jade",
    preview: "/dices-skins/green-jade/dice-5.png",
    price: 2.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SKIN_GREEN_JADE_PRICE_ID ?? null,
    free: false,
    purchasable: true,
  },
];

/** Get a skin definition by ID */
export function getSkinById(id: string | null): SkinDefinition | undefined {
  return SKIN_CATALOG.find((s) => s.id === id);
}

/** Get all skins available in the shop (purchasable, non-free) */
export function getShopSkins(): SkinDefinition[] {
  return SKIN_CATALOG.filter((s) => s.purchasable && !s.free && s.id !== null);
}

/** Get all tournament-exclusive skins (not purchasable, not premium-only) */
export function getTournamentSkins(): SkinDefinition[] {
  return SKIN_CATALOG.filter((s) => !s.purchasable && !s.free && !s.premiumOnly);
}

/** Get all premium-exclusive skins */
export function getPremiumSkins(): SkinDefinition[] {
  return SKIN_CATALOG.filter((s) => s.premiumOnly === true);
}
