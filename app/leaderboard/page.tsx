import type { Metadata } from "next";
import { LeaderboardClient } from "./_components/leaderboard-client";

const BASE_URL = "https://dixo-game.com";

export const metadata: Metadata = {
  title: "Leaderboard — Top Ranked Players",
  description:
    "See the top-ranked Liar's Dice players on Dixo. Separate ELO leaderboards for 1v1 and 4-player ranked games. Climb from Bronze to Diamond.",
  alternates: {
    canonical: `${BASE_URL}/leaderboard`,
  },
  openGraph: {
    title: "Dixo Leaderboard — Top Ranked Players",
    description:
      "See the top-ranked Liar's Dice players. Separate ELO leaderboards for 1v1 and 4-player formats.",
    url: `${BASE_URL}/leaderboard`,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Dixo" }],
  },
};

const leaderboardJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${BASE_URL}/leaderboard#webpage`,
  name: "Dixo Leaderboard — Top Ranked Players",
  description:
    "See the top-ranked Liar's Dice players on Dixo. Separate ELO leaderboards for 1v1 and 4-player ranked games.",
  url: `${BASE_URL}/leaderboard`,
  isPartOf: { "@id": `${BASE_URL}/#website` },
  about: { "@id": `${BASE_URL}/#game` },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Leaderboard",
        item: `${BASE_URL}/leaderboard`,
      },
    ],
  },
};

export default function LeaderboardPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leaderboardJsonLd) }}
      />
      <LeaderboardClient />
    </>
  );
}
