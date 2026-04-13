import { defaultLocale, isLocale, localeCookieName } from "@/lib/i18n";
import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const localeFromCookie = (await cookies()).get(localeCookieName)?.value;
  const locale = isLocale(localeFromCookie) ? localeFromCookie : defaultLocale;

  return {
    locale,
    messages: (await import(`../intl/${locale}.json`)).default,
  };
});
