import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { InviteProvider } from "@/components/providers/invite-provider";
import { SoundProvider } from "@/components/providers/sound-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://dixo-game.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Dixo — Free Online Liar's Dice Game (Perudo)",
    template: "%s | Dixo",
  },
  description:
    "Play Liar's Dice (Perudo) online for free. Bluff, bid, and outlast 2-6 players in ranked or casual matches. No download required — play instantly in your browser.",
  manifest: "/manifest.json",
  themeColor: "#09090b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dixo",
  },
  openGraph: {
    type: "website",
    siteName: "Dixo",
    title: "Dixo — Free Online Liar's Dice Game (Perudo)",
    description:
      "Play Liar's Dice (Perudo) online for free. Bluff, bid, and outlast 2-6 players in ranked or casual matches. No download required.",
    url: BASE_URL,
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Dixo — Online Liar's Dice Game",
      },
    ],
    locale: "en",
    alternateLocale: ["fr", "es"],
  },
  twitter: {
    card: "summary",
    title: "Dixo — Free Online Liar's Dice Game",
    description:
      "Play Liar's Dice online for free. Bluff your opponents, climb the ELO leaderboard, and become the ultimate dice bluffer.",
    images: ["/icon-512.png"],
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      en: BASE_URL,
      fr: BASE_URL,
      es: BASE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
      <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${BASE_URL}/#website`,
                  url: BASE_URL,
                  name: "Dixo",
                  description:
                    "Free online multiplayer Liar's Dice (Perudo) game. Bluff your opponents or get caught.",
                  inLanguage: ["en", "fr", "es"],
                },
                {
                  "@type": "Organization",
                  "@id": `${BASE_URL}/#organization`,
                  name: "Dixo",
                  url: BASE_URL,
                  logo: {
                    "@type": "ImageObject",
                    url: `${BASE_URL}/icon-512.png`,
                    width: 512,
                    height: 512,
                  },
                },
                {
                  "@type": "VideoGame",
                  "@id": `${BASE_URL}/#game`,
                  name: "Dixo",
                  alternateName: [
                    "Liar's Dice Online",
                    "Perudo Online",
                  ],
                  description:
                    "Dixo is a free online multiplayer Liar's Dice game (Perudo). Bluff your opponents about the dice on the table, call their bluffs, and be the last player standing. Play ranked or casual games with friends or strangers.",
                  url: BASE_URL,
                  image: `${BASE_URL}/icon-512.png`,
                  genre: [
                    "Strategy",
                    "Bluffing",
                    "Dice Game",
                    "Multiplayer",
                  ],
                  numberOfPlayers: {
                    "@type": "QuantitativeValue",
                    minValue: 2,
                    maxValue: 6,
                  },
                  playMode: "MultiPlayer",
                  applicationCategory: "GameApplication",
                  operatingSystem: "Web Browser",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "EUR",
                    availability: "https://schema.org/InStock",
                    url: BASE_URL,
                  },
                  publisher: { "@id": `${BASE_URL}/#organization` },
                  inLanguage: ["en", "fr", "es"],
                  isAccessibleForFree: true,
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
              <NotificationProvider>
                <InviteProvider>
                  <SoundProvider>
                    {children}
                  </SoundProvider>
                </InviteProvider>
              </NotificationProvider>
              <Toaster position="top-center" richColors />
              <ServiceWorkerRegister />
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
