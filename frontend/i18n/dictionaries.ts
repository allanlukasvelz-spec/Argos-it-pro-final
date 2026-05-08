import ca from "@/i18n/locales/ca.json";
import de from "@/i18n/locales/de.json";
import en from "@/i18n/locales/en.json";
import es from "@/i18n/locales/es.json";
import fr from "@/i18n/locales/fr.json";
import it from "@/i18n/locales/it.json";
import pt from "@/i18n/locales/pt.json";
import { defaultLocale, type Locale } from "@/i18n/config";

type DictionaryValue = string | number | boolean | null | DictionaryValue[] | DictionaryTree;
type DictionaryTree = { [key: string]: DictionaryValue };

export const dictionaries: Record<Locale, DictionaryTree> = {
  es,
  en,
  ca,
  fr,
  de,
  it,
  pt
};

export function isLocale(value: string): value is Locale {
  return Object.prototype.hasOwnProperty.call(dictionaries, value);
}

function resolvePath(tree: DictionaryTree, path: string): DictionaryValue | undefined {
  const segments = path.split(".");
  let cursor: DictionaryValue = tree;

  for (const segment of segments) {
    if (typeof cursor !== "object" || cursor === null || Array.isArray(cursor)) return undefined;
    cursor = (cursor as DictionaryTree)[segment];
    if (typeof cursor === "undefined") return undefined;
  }

  return cursor;
}

export function getDictionaryValue<T = DictionaryValue>(
  locale: Locale,
  key: string,
  fallback?: T
): T {
  const current = resolvePath(dictionaries[locale], key);
  if (typeof current !== "undefined") return current as T;

  const base = resolvePath(dictionaries[defaultLocale], key);
  if (typeof base !== "undefined") return base as T;

  return fallback as T;
}

export function translate(locale: Locale, key: string, fallback = key): string {
  const value = getDictionaryValue(locale, key, fallback);
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}
