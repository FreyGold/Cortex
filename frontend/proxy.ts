import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/neon/server";
import { defaultLocale, isLocale, type Locale, localeCookieName, locales } from "@/lib/i18n";

const protectedPrefixes = ["/notes", "/profile", "/admin", "/settings", "/daily"];
const checkAuth = auth.middleware({ loginUrl: "/auth/login" });

function detectLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(localeCookieName)?.value;
  if (isLocale(saved)) return saved;
  const accepted = request.headers.get("accept-language")?.toLowerCase() ?? "";
  return locales.find((locale) => accepted.includes(locale)) ?? defaultLocale;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const response = protectedRoute ? await checkAuth(request) : NextResponse.next();
  response.cookies.set(localeCookieName, detectLocale(request), { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
