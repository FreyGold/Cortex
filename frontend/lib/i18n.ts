export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
