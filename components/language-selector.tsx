"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/set-locale";
import { Flag } from "@/components/flags";

const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

export function LanguageSelector() {
  const t = useTranslations("settings");
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  function handleChange(locale: Locale) {
    setLocale(locale);
    router.refresh();
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Flag locale={currentLocale} className="mr-2 size-4 rounded-sm" />
        <span>{t("language")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
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
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
