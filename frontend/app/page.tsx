import {
  ArrowRight,
  BookMarked,
  Brain,
  CheckCircle,
  Notebook,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShellHeaderActions } from "@/components/shell-header-actions";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerSession } from "@/lib/auth";

const featureIcons = [Notebook, BookMarked, Brain];

export const metadata = {
  title: "Cortex | Academic workspace",
  description:
    "Notes, course data, and verification in one academic workspace for students.",
};

export default async function Home() {
  const t = await getTranslations("home");
  const shellT = await getTranslations("shell");

  const session = await getServerSession();
  const signedIn = Boolean(session);
  const isAdmin = session?.profile?.role === "admin";

  const primaryHref = signedIn ? "/notes" : "/auth/signup";
  const primaryLabel = signedIn
    ? t("actions.openNotes")
    : t("actions.getStarted");
  const headerLinks = [
    {
      href: "/notes",
      label: shellT("nav.notes"),
    },
    {
      href: "/data",
      label: shellT("nav.data"),
    },
    {
      href: "/settings",
      label: shellT("nav.settings"),
    },
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: shellT("nav.admin"),
          },
        ]
      : []),
  ];

  return (
    <div className="bg-background min-h-screen bg-dot-pattern relative overflow-hidden">
      {/* Decorative top-center glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[380px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
      
      <SiteHeader
        navItems={headerLinks.map((item) => ({
          ...item,
          active: false,
        }))}
        actions={
          <ShellHeaderActions
            signedIn={signedIn}
            authLabel={signedIn ? shellT("logout") : t("actions.signIn")}
          />
        }
      />

      <main className="container mx-auto space-y-12 px-4 py-8 md:py-12 lg:py-16">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div className="space-y-6">
            <Badge
              variant="outline"
              className="rounded-full px-3 text-[11px] font-bold uppercase tracking-wider"
            >
              {signedIn ? t("hero.badgeSignedIn") : t("hero.badge")}
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-7xl leading-[1.1]">
                {signedIn ? t("hero.titleSignedIn") : t("hero.title")}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
                {signedIn ? t("hero.subtitleSignedIn") : t("hero.subtitle")}
              </p>
            </div>

            {signedIn ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <CheckCircle className="size-4 text-emerald-500" />
                <p className="text-sm text-muted-foreground">
                  {t("hero.signedInAs", {
                    email: session?.user?.email ?? "your account",
                  })}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href={primaryHref}>
                  {primaryLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/data">{t("actions.exploreData")}</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: t("highlights.notes.title"),
                  description: t("highlights.notes.description"),
                },
                {
                  title: t("highlights.data.title"),
                  description: t("highlights.data.description"),
                },
                {
                  title: t("highlights.profile.title"),
                  description: t("highlights.profile.description"),
                },
              ].map((item) => (
                <Card key={item.title} className="bg-card/65 backdrop-blur-md border-border/45 hover:border-primary/35 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Zap className="size-4" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        {t("highlights.label")}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-border/45 bg-card/45 p-5 shadow-xl backdrop-blur-md md:p-6">
            <div className="space-y-2 border-b border-border/40 pb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {t("panel.kicker")}
              </p>
              <h2 className="text-xl font-semibold tracking-tight">
                {t("panel.title")}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("panel.subtitle")}
              </p>
            </div>
            {[
              { key: "notes", href: "/notes", icon: Notebook },
              { key: "data", href: "/data", icon: BookMarked },
              { key: "profile", href: "/settings", icon: ShieldCheck },
            ].map(({ key, href, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className="group flex items-start gap-4 rounded-2xl border border-border/40 bg-background/55 p-4 transition-colors hover:border-primary/40 hover:bg-background/85"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">
                      {t(`panel.items.${key}.label`)}
                    </span>
                    <span className="text-xs font-medium text-primary">
                      {t(`panel.items.${key}.value`)}
                    </span>
                  </span>
                  <span className="block text-sm leading-relaxed text-muted-foreground">
                    {t(`panel.items.${key}.detail`)}
                  </span>
                </span>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="max-w-2xl space-y-2">
            <Badge variant="outline" className="rounded-full px-3">
              {t("sections.badge")}
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {t("sections.title")}
            </h2>
            <p className="text-muted-foreground">{t("sections.subtitle")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              t("sections.items.0"),
              t("sections.items.1"),
              t("sections.items.2"),
            ].map((title, index) => {
              const Icon = featureIcons[index];
              return (
                <Card key={title} className="bg-card/65 backdrop-blur-md border-border/45 hover:border-primary/35 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]">
                  <CardHeader className="space-y-3">
                    <Icon className="size-5 text-primary" />
                    <CardTitle className="text-base font-semibold">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t(`sections.descriptions.${index}`)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
