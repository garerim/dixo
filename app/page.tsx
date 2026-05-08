import type { Metadata } from "next";
import { HomeClient } from "./_components/home-client";

const BASE_URL = "https://www.dixo-game.com";

export const metadata: Metadata = {
  title: "Dixo — Free Online Dice Bluffing Game",
  description:
    "Play Dixo online for free with 2-6 players. Bluff, bid, and outlast your opponents in ranked or casual matches. No download — play instantly in your browser.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Dixo — Free Online Dice Bluffing Game",
    description:
      "Play Dixo online for free with 2-6 players. Bluff, bid, and outlast your opponents in ranked or casual matches.",
    url: BASE_URL,
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Dixo" }],
  },
};

export default function Page() {
  return <HomeClient />;
}
