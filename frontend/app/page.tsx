import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Badge } from "@/components/ui/badge";
import { CortexButton } from "@/components/ui/cortex-button";
import {
  CortexCard,
  CortexCardContent,
  CortexCardDescription,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";

const featureIcons = ["🧠", "📚", "⚡"];

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              C
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Cortex</p>
              <p className="text-xs text-muted-foreground">{t("brandSub")}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link className="hover:text-foreground" href="/editor">
              {t("nav.notes")}
            </Link>
            <Link className="hover:text-foreground" href="/data">
              {t("nav.data")}
            </Link>
            <Link className="hover:text-foreground" href="/auth/login">
              {t("nav.auth")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/auth/login">
              <CortexButton variant="outline" size="sm">
                {t("actions.signIn")}
              </CortexButton>
            </Link>
            <Link href="/auth/signup" className="hidden sm:inline-flex">
              <CortexButton size="sm">{t("actions.getStarted")}</CortexButton>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-16 px-4 py-14 md:space-y-24 md:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge variant="brand">{t("hero.badge")}</Badge>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/data">
                <CortexButton size="lg">
                  {t("actions.exploreData")}
                </CortexButton>
              </Link>
              <Link href="/editor">
                <CortexButton size="lg" variant="outline">
                  {t("actions.openEditor")}
                </CortexButton>
              </Link>
            </div>
          </div>

          <CortexCard
            level="modal"
            className="bg-gradient-to-b from-card to-secondary/35"
          >
            <CortexCardHeader>
              <CortexCardTitle>{t("panel.title")}</CortexCardTitle>
              <CortexCardDescription>
                {t("panel.subtitle")}
              </CortexCardDescription>
            </CortexCardHeader>
            <CortexCardContent className="space-y-4">
              <div className="rounded-md border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("panel.cards.today")}
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {t("panel.cards.todayValue")}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("panel.cards.focus")}
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {t("panel.cards.focusValue")}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">
                  {t("panel.cards.next")}
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {t("panel.cards.nextValue")}
                </p>
              </div>
            </CortexCardContent>
          </CortexCard>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("features.title")}
            </h2>
            <p className="text-muted-foreground">{t("features.subtitle")}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <CortexCard key={index}>
                <CortexCardHeader>
                  <div className="mb-2 text-2xl" aria-hidden="true">
                    {featureIcons[index]}
                  </div>
                  <CortexCardTitle>
                    {t(`features.items.${index}.title`)}
                  </CortexCardTitle>
                  <CortexCardDescription>
                    {t(`features.items.${index}.description`)}
                  </CortexCardDescription>
                </CortexCardHeader>
              </CortexCard>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("workflow.title")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <CortexCard key={step} level="flat">
                <CortexCardHeader>
                  <Badge variant="synapse">
                    {t("workflow.stepLabel", { step })}
                  </Badge>
                  <CortexCardTitle>
                    {t(`workflow.steps.${step}.title`)}
                  </CortexCardTitle>
                  <CortexCardDescription>
                    {t(`workflow.steps.${step}.description`)}
                  </CortexCardDescription>
                </CortexCardHeader>
              </CortexCard>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
