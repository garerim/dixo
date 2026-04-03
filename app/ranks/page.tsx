import type { Metadata } from "next";
import { RanksClient } from "./_components/ranks-client";

const BASE_URL = "https://dixo-game.com";

export const metadata: Metadata = {
  title: "ELO Rank Tiers — Bronze to Diamond",
  description:
    "Explore all Dixo ELO rank tiers from Bronze to Diamond. Learn how the dual ELO system works for 1v1 and 4-player ranked Liar's Dice matches.",
  alternates: {
    canonical: `${BASE_URL}/ranks`,
  },
  openGraph: {
    title: "Dixo ELO Rank Tiers — Bronze to Diamond",
    description:
      "Explore all Dixo rank tiers. Climb from Bronze to Diamond in 1v1 and 4-player ranked matches.",
    url: `${BASE_URL}/ranks`,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Dixo" }],
  },
};

const ranksJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${BASE_URL}/ranks#webpage`,
  name: "Dixo ELO Rank Tiers — Bronze to Diamond",
  description:
    "Explore all Dixo ELO rank tiers. Learn how the dual ranking system works for 1v1 and 4-player ranked matches.",
  url: `${BASE_URL}/ranks`,
  isPartOf: { "@id": `${BASE_URL}/#website` },
  about: { "@id": `${BASE_URL}/#game` },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Ranks",
        item: `${BASE_URL}/ranks`,
      },
    ],
  },
};

export default function RanksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ranksJsonLd) }}
      />
      <RanksClient />
    </>
  );
}
