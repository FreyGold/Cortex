"use client";

import { Globe } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { defaultLocale, type Locale, localeCookieName } from "@/lib/i18n";

const localeOrder: Locale[] = ["en", "ar"];

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === "en" || htmlLang === "ar") {
      setLocale(htmlLang as Locale);
    }
  }, []);

  const nextLocale: Locale =
    locale === localeOrder[0] ? localeOrder[1] : localeOrder[0];

  const onToggleLocale = () => {
    // Set cookie using traditional method for maximum compatibility
    const date = new Date();
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
    document.cookie = `${localeCookieName}=${nextLocale}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground font-semibold"
      onClick={onToggleLocale}
    >
      <Globe className="size-4" />
      <span className="text-[10px] uppercase tracking-wider">{nextLocale}</span>
    </Button>
  );
}
