"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/set-locale";
import { Flag } from "@/components/flags";

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

export function LanguageButton() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("settings");

  function handleChange(locale: Locale) {
    setLocale(locale);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-label={t("language")}>
          <Flag locale={currentLocale} className="size-4 rounded-sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleChange(locale)}
            className={currentLocale === locale ? "bg-accent" : ""}
          >
            <Flag locale={locale} className="mr-2 size-4 rounded-sm" />
            {LOCALE_LABELS[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
