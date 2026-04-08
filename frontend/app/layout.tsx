import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full antialiased", inter.variable)}
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
