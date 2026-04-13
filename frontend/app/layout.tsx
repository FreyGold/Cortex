import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Providers } from "@/app/providers";
import { defaultLocale, getDirection, isLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cortex — Your Academic Second Brain",
  description:
    "AI-powered notes, semantic search, and shared academic resources for university students. Think smarter, study better.",
  keywords: [
    "notes",
    "AI",
    "academic",
    "university",
    "knowledge base",
    "semantic search",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeFromRequest = await getLocale();
  const locale = isLocale(localeFromRequest)
    ? localeFromRequest
    : defaultLocale;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={getDirection(locale)}
      className={cn("h-full antialiased", inter.variable)}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
