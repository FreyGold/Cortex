"use client";

import { useEffect, useState } from "react";
import { CortexButton } from "@/components/ui/cortex-button";
import { defaultLocale, type Locale, localeCookieName } from "@/lib/i18n";

const localeOrder: Locale[] = ["en", "ar"];

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === "en" || htmlLang === "ar") {
      setLocale(htmlLang);
    }
  }, []);

  const nextLocale: Locale =
    locale === localeOrder[0] ? localeOrder[1] : localeOrder[0];

  const onToggleLocale = async () => {
    await cookieStore.set({
      name: localeCookieName,
      value: nextLocale,
      path: "/",
      expires: Date.now() + 31536000 * 1000,
      sameSite: "lax",
    });
    window.location.reload();
  };

  return (
    <CortexButton variant="outline" size="sm" onClick={onToggleLocale}>
      {nextLocale.toUpperCase()}
    </CortexButton>
  );
}
