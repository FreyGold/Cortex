"use client";

import { BookOpen } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type HeaderLink = {
  href: string;
  label: string;
  active?: boolean;
};

type SiteHeaderProps = {
  navItems: HeaderLink[];
  actions: React.ReactNode;
  brandHref?: string;
};

export function SiteHeader({
  navItems,
  actions,
  brandHref = "/",
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
        <Link href={brandHref} className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" weight="fill" />
          <span className="text-sm font-semibold tracking-tight">Cortex</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
