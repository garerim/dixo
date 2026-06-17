// =============================================================================
// COMPONENT — Site footer (branding + product links + liens légaux)
// =============================================================================

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

const PRODUCT_LINKS = [
  { href: "/how-to-play", labelKey: "howToPlay" },
  { href: "/pricing", labelKey: "pricing" },
] as const;

const LEGAL_LINKS = [
  { href: "/legal/legal-notice", labelKey: "legalNotice" },
  { href: "/legal/terms-of-sale", labelKey: "termsOfSale" },
  { href: "/legal/terms-of-use", labelKey: "termsOfUse" },
  { href: "/legal/privacy-policy", labelKey: "privacy" },
  { href: "/accessibility", labelKey: "accessibility" },
] as const;

export function LegalFooter() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/50 px-4 py-4 text-xs text-muted-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2.5">
        {/* Top row: brand + links */}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand inline */}
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-foreground">Dixo</span>
            <span className="opacity-50" aria-hidden>·</span>
            <span>{t("tagline")}</span>
            <span className="opacity-50" aria-hidden>·</span>
            <span>
              {t("madeBy")}{" "}
              <a
                href="https://x.com/Gama_dev13"
                target="_blank"
                rel="noopener noreferrer"
                className="underline transition-colors hover:text-foreground"
              >
                @Gama_dev13
              </a>
            </span>
          </div>

          {/* Links inline */}
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
            {PRODUCT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-foreground"
              >
                {tc(l.labelKey)}
              </Link>
            ))}
            <span className="opacity-40" aria-hidden>|</span>
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-foreground"
              >
                {t(l.labelKey)}
              </Link>
            ))}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              title={t("rllEuTitle")}
              className="transition-colors hover:text-foreground"
            >
              {t("rllEu")}
            </a>
          </nav>
        </div>

        {/* Bottom row: copyright */}
        <div className="border-t border-border/40 pt-2 text-center text-[11px] opacity-70">
          &copy; {year} Dixo — {t("editedBy")}. {t("allRightsReserved")}.
        </div>
      </div>
    </footer>
  );
}
