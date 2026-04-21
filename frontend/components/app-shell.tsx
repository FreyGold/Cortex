"use client";

import {
  Database,
  SquarePen as NotePencil,
  ShieldCheck,
  UserCircle2 as UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMessages } from "next-intl";
import { useMemo } from "react";
import { useCurrentProfile } from "@/hooks/use-profile";
import { getMessage } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { ShellHeaderActions } from "@/components/shell-header-actions";
import { ClientOnly } from "./client-only";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/notes", key: "notes", Icon: NotePencil },
  { href: "/data", key: "data", Icon: Database },
  { href: "/settings", key: "settings", Icon: UserCircle },
  { href: "/admin", key: "admin", Icon: ShieldCheck },
] as const;

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const messages = useMessages();
  const { data: profileData } = useCurrentProfile();

  const isAppPage = pathname.startsWith("/notes") || pathname.startsWith("/data");

  const visibleNavItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          item.key !== "admin" || profileData?.profile?.role === "admin",
      ),
    [profileData],
  );

  const headerNavItems = visibleNavItems.map((item) => ({
    href: item.href,
    label: getMessage(messages, `shell.nav.${item.key}`, item.key),
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));

  return (
    <ClientOnly>
      <div className="flex flex-col bg-background relative min-h-screen">
        {!isAppPage && (
          <SiteHeader
            navItems={headerNavItems}
            actions={
              <ShellHeaderActions
                signedIn
                authLabel={getMessage(messages, "shell.logout", "Logout")}
              />
            }
          />
        )}

        <div className="flex-1 relative flex flex-col">{children}</div>

        {/* Mobile bottom nav - hidden on app pages to reduce clutter */}
        {!isAppPage && (
          <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 px-2 py-2 backdrop-blur md:hidden">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))`,
              }}
            >
              {visibleNavItems.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-md px-2 py-2 text-xs font-medium transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.Icon className="size-4" />
                    {getMessage(messages, `shell.nav.${item.key}`, item.key)}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </ClientOnly>
  );
}
