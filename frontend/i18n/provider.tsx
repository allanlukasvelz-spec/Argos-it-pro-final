"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  defaultLocale,
  localeStorageKey,
  supportedLocales,
  type Locale
} from "@/i18n/config";
import { getDictionaryValue, isLocale, translate } from "@/i18n/dictionaries";

type I18nContextValue = {
  locale: Locale;
  ready: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  get: <T = unknown>(key: string, fallback?: T) => T;
  locales: readonly Locale[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  const [primary] = (navigator.language || defaultLocale).toLowerCase().split("-");
  return isLocale(primary) ? primary : defaultLocale;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined"
      ? window.localStorage.getItem(localeStorageKey)
      : null;
    const normalized = saved && isLocale(saved) ? saved : detectBrowserLocale();
    setLocaleState(normalized);
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.setAttribute("data-locale", locale);
    window.localStorage.setItem(localeStorageKey, locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => translate(locale, key, fallback),
    [locale]
  );

  const get = useCallback(
    <T,>(key: string, fallback?: T) => getDictionaryValue<T>(locale, key, fallback),
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      ready,
      setLocale,
      t,
      get,
      locales: supportedLocales
    }),
    [get, locale, ready, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return context;
}
