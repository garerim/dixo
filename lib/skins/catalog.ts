// =============================================================================
// Skin Catalog — Single source of truth for all dice skins
// =============================================================================
// Add new skins here. The `id` must match the folder name in /public/dices-skins/.
// Set `priceId` to the Stripe Price ID for purchasable skins.
// =============================================================================

export interface SkinDefinition {
  /** Unique ID — matches folder name in /public/dices-skins/ (null = default) */
  id: string | null;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Preview image path (null = render default DiceFace) */
  preview: string | null;
  /** Price in euros (0 = free / included) */
  price: number;
  /** Stripe Price ID for one-time purchase (null = free skin) */
  stripePriceId: string | null;
  /** If true, everyone owns this skin by default */
  free: boolean;
}

export const SKIN_CATALOG: SkinDefinition[] = [
  {
    id: null,
    name: "Classic",
    description: "Default dice style",
    preview: null,
    price: 0,
    stripePriceId: null,
    free: true,
  },
  {
    id: "gold-ruby",
    name: "Gold Ruby",
    description: "Elegant gold dice with ruby dots",
    preview: "/dices-skins/gold-ruby/dice-5.png",
    price: 2.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SKIN_GOLD_RUBY_PRICE_ID ?? null,
    free: false,
  },
  {
    id: "star-night",
    name: "Star Night",
    description: "Dark dice with starry night patterns",
    preview: "/dices-skins/star-night/dice-5.png",
    price: 2.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SKIN_STAR_NIGHT_PRICE_ID ?? null,
    free: false,
  },
  {
    id: "green-jade",
    name: "Green Jade",
    description: "Carved jade dice with golden inlays",
    preview: "/dices-skins/green-jade/dice-5.png",
    price: 2.99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SKIN_GREEN_JADE_PRICE_ID ?? null,
    free: false,
  },
];

/** Get a skin definition by ID */
export function getSkinById(id: string | null): SkinDefinition | undefined {
  return SKIN_CATALOG.find((s) => s.id === id);
}
