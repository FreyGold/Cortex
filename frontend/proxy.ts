import { type NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  type Locale,
  localeCookieName,
  locales,
} from "@/lib/i18n";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPrefixes = ["/notes", "/profile", "/admin", "/settings"];
const authPrefixes = ["/auth/login", "/auth/signup"];

function startsWithPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie.name, cookie.value, cookie);
  }
}

function detectLocale(request: NextRequest): Locale {
  const localeFromCookie = request.cookies.get(localeCookieName)?.value;
  if (isLocale(localeFromCookie)) {
    return localeFromCookie;
  }

  const acceptLanguage =
    request.headers.get("accept-language")?.toLowerCase() ?? "";
  for (const locale of locales) {
    if (acceptLanguage.includes(locale)) {
      return locale;
    }
  }

  return defaultLocale;
}

function setLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const locale = detectLocale(request);
  setLocaleCookie(response, locale);

  if (!user && startsWithPrefix(pathname, protectedPrefixes)) {
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    if (hasSession) {
      const logoutUrl = new URL("/auth/logout/submit", request.url);
      const redirectResponse = NextResponse.redirect(logoutUrl);
      copyCookies(response, redirectResponse);
      setLocaleCookie(redirectResponse, locale);
      return redirectResponse;
    }

    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);

    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    setLocaleCookie(redirectResponse, locale);
    return redirectResponse;
  }

  if (user && startsWithPrefix(pathname, authPrefixes)) {
    const notesUrl = new URL("/notes", request.url);
    const redirectResponse = NextResponse.redirect(notesUrl);
    copyCookies(response, redirectResponse);
    setLocaleCookie(redirectResponse, locale);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
