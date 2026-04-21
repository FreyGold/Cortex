import {
  ArrowRight,
  Brain,
  CheckCircle,
  Zap,
  BookMarked,
  Notebook,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { ShellHeaderActions } from "@/components/shell-header-actions";
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
      label: shellT("nav.settings", "Settings"),
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
    <div className="bg-background min-h-screen">
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
            <Badge variant="outline" className="rounded-full px-3 text-[11px] font-bold uppercase tracking-wider">
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
                <Card key={item.title} className="shadow-none">
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

          <Card className="border-border/60 shadow-none">
            <CardHeader className="space-y-2 border-b border-border/60 pb-5">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="size-5" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("panel.kicker")}
                </span>
              </div>
              <CardTitle className="text-xl font-bold">
                {t("panel.title")}
              </CardTitle>
              <CardDescription>{t("panel.subtitle")}</CardDescription>
            </CardHeader>
            <div className="grid gap-3 p-4">
              {[
                {
                  label: t("panel.items.notes.label"),
                  value: t("panel.items.notes.value"),
                  detail: t("panel.items.notes.detail"),
                },
                {
                  label: t("panel.items.data.label"),
                  value: t("panel.items.data.value"),
                  detail: t("panel.items.data.detail"),
                },
                {
                  label: t("panel.items.profile.label"),
                  value: t("panel.items.profile.value"),
                  detail: t("panel.items.profile.detail"),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border/50 bg-background p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <p className="text-right text-sm font-medium text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
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
                <Card key={title} className="shadow-none">
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
