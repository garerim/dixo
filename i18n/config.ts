export const SUPPORTED_LOCALES = ["fr", "en", "es"] as const;
export const DEFAULT_LOCALE = "fr";
export type Locale = (typeof SUPPORTED_LOCALES)[number];
