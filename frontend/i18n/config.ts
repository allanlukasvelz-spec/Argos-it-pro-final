export const supportedLocales = ["es", "en", "ca", "fr", "de", "it", "pt"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "es";

export const localeStorageKey = "argos_locale";
