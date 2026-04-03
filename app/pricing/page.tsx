import type { Metadata } from "next";
import { PricingClient } from "./_components/pricing-client";

const BASE_URL = "https://dixo-game.com";

export const metadata: Metadata = {
  title: "Pricing — Free & Premium Plans",
  description:
    "Dixo is free to play. Upgrade to Dixo Premium for 4.99 EUR/month to unlock GIF avatars, a Premium badge, and full ELO history. Cancel anytime.",
  alternates: {
    canonical: `${BASE_URL}/pricing`,
  },
  openGraph: {
    title: "Dixo Pricing — Free & Premium Plans",
    description:
      "Dixo is free to play. Upgrade to Premium for GIF avatars, a Premium badge, and full ELO history. 4.99 EUR/month, cancel anytime.",
    url: `${BASE_URL}/pricing`,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Dixo" }],
  },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Dixo Pricing Plans",
  url: `${BASE_URL}/pricing`,
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      item: {
        "@type": "Product",
        name: "Dixo Free",
        url: `${BASE_URL}/pricing`,
        image: `${BASE_URL}/icon-512.png`,
        description:
          "Free access to Dixo online Liar's Dice. Includes ranked and casual games, friends, chat, ELO ranking, and avatar customisation.",
        brand: { "@type": "Brand", name: "Dixo" },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: BASE_URL,
        },
      },
    },
    {
      "@type": "ListItem",
      position: 2,
      item: {
        "@type": "Product",
        name: "Dixo Premium",
        url: `${BASE_URL}/pricing`,
        image: `${BASE_URL}/icon-512.png`,
        description:
          "Dixo Premium unlocks GIF avatars, a Premium badge visible in-game and on your profile, and full ELO history access. 4.99 EUR per month, cancel anytime.",
        brand: { "@type": "Brand", name: "Dixo" },
        offers: {
          "@type": "Offer",
          price: "4.99",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "4.99",
            priceCurrency: "EUR",
            billingIncrement: 1,
            unitCode: "MON",
            referenceQuantity: {
              "@type": "QuantitativeValue",
              value: 1,
              unitCode: "MON",
            },
          },
          url: `${BASE_URL}/pricing`,
        },
      },
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <PricingClient />
    </>
  );
}
