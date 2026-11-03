import {
  ArrowRight,
  BookMarked,
  Brain,
  CheckCircle,
  FileText,
  Notebook,
  ShieldCheck,
  Sparkles,
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

          <div className="relative rounded-3xl border border-border/45 bg-card/45 p-5 md:p-6 backdrop-blur-md shadow-2xl group overflow-hidden transition-all duration-500 hover:border-primary/30">
            {/* Glossy overlay sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
            
            {/* Live Dashboard Mockup Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-destructive/80" />
                  <span className="size-2.5 rounded-full bg-axon/80" />
                  <span className="size-2.5 rounded-full bg-success/80" />
                </div>
                <div className="h-4 w-[1px] bg-border/20 mx-1.5" />
                <span className="text-[10px] font-mono text-muted-foreground/50">cortex.workspace.app</span>
              </div>
              <Badge variant="outline" className="rounded-full text-[9px] font-bold tracking-wider bg-primary/5 text-primary border-primary/25 animate-pulse">
                LIVE INTERACTION
              </Badge>
            </div>

            {/* Dashboard Simulated UI Grid */}
            <div className="grid grid-cols-[80px_1fr] h-[280px] rounded-2xl border border-border/30 bg-background/50 overflow-hidden shadow-inner">
              {/* Mock Sidebar */}
              <div className="border-r border-border/30 bg-sidebar/60 p-2 space-y-4 flex flex-col">
                <div className="flex justify-center mb-1">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-xs border border-primary/10">C</div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="h-1.5 w-full rounded-pill bg-primary/20" />
                  <div className="h-1.5 w-4/5 rounded-pill bg-muted/50" />
                  <div className="h-1.5 w-5/6 rounded-pill bg-muted/50" />
                  <div className="h-1.5 w-3/4 rounded-pill bg-muted/50" />
                </div>
                <div className="pt-4 border-t border-border/20 space-y-2">
                  <div className="h-1.5 w-full rounded bg-muted/40" />
                  <div className="h-1.5 w-5/6 rounded bg-muted/40" />
                </div>
              </div>

              {/* Mock Work Area */}
              <div className="p-4 flex flex-col justify-between h-full bg-background/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 rounded bg-foreground/10" />
                    <div className="h-2 w-8 rounded bg-muted/40" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Mock Note Card 1 */}
                    <div className="p-3 rounded-xl border border-border/30 bg-card/65 space-y-2 hover:border-primary/45 transition-all hover:shadow-xs active:scale-[0.98] cursor-pointer">
                      <div className="size-4.5 rounded bg-primary/10 text-primary flex items-center justify-center border border-primary/10"><FileText className="size-3" /></div>
                      <div className="h-1.5 w-full rounded bg-foreground/10" />
                      <div className="h-1 w-2/3 rounded bg-muted/30" />
                    </div>
                    {/* Mock Note Card 2 */}
                    <div className="p-3 rounded-xl border border-border/30 bg-card/65 space-y-2 hover:border-primary/45 transition-all hover:shadow-xs active:scale-[0.98] cursor-pointer">
                      <div className="size-4.5 rounded bg-brand/10 text-brand flex items-center justify-center border border-brand/10"><FileText className="size-3" /></div>
                      <div className="h-1.5 w-full rounded bg-foreground/10" />
                      <div className="h-1 w-3/4 rounded bg-muted/30" />
                    </div>
                  </div>
                </div>

                {/* Floating AI Notification widget inside mockup */}
                <div className="p-3 rounded-xl border border-synapse/30 bg-synapse/5 flex items-center justify-between gap-3 shadow-xs hover:bg-synapse/10 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="size-3.5 text-synapse shrink-0" />
                    <div className="text-[9px] space-y-0.5 text-left min-w-0">
                      <div className="font-bold text-foreground truncate">Knowledge AI</div>
                      <div className="text-muted-foreground truncate">Synthesized 4 active lecture notes</div>
                    </div>
                  </div>
                  <ArrowRight className="size-3 text-synapse/70 shrink-0" />
                </div>
              </div>
            </div>

            {/* Verification Stats overlay at bottom */}
            <div className="mt-4 grid grid-cols-3 gap-2.5 pt-4 border-t border-border/40">
              {[
                { label: t("panel.items.notes.label"), val: "14 Notes" },
                { label: t("panel.items.data.label"), val: "5 Courses" },
                { label: t("panel.items.profile.label"), val: "Verified" }
              ].map((item) => (
                <div key={item.label} className="p-2.5 rounded-xl border border-border/30 bg-background/40 hover:bg-background/80 transition-all text-center">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50">{item.label}</span>
                  <span className="block text-xs font-bold mt-0.5 text-foreground">{item.val}</span>
                </div>
              ))}
            </div>
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
