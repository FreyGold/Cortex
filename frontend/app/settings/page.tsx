import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import { ProfileSetupForm } from "@/components/profile/profile-setup-form";
import { ProfileStatusCard } from "@/components/profile/profile-status-card";
import { getCatalogData } from "@/lib/data/catalog";
import { getServerSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, GraduationCap, Settings2, Globe, Moon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function SettingsPage() {
  const t = await getTranslations("settingsPage");
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/settings");
  }

  const [catalog] = await Promise.all([getCatalogData()]);
  const profile = session.profile;

  return (
    <AppShell>
      <main className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full" orientation="vertical">
          <TabsList className="mb-8 flex flex-wrap gap-2 bg-transparent p-0 justify-start" variant="line">
            <TabsTrigger value="profile" className="gap-2">
              <User className="size-4" />
              {t("tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2">
              <GraduationCap className="size-4" />
              {t("tabs.academic")}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Settings2 className="size-4" />
              {t("tabs.preferences")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 outline-none">
            <ProfileStatusCard showEditLink={false} />
          </TabsContent>

          <TabsContent value="academic" className="space-y-6 outline-none">
             <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  {t("academicHelper")}
                </p>
             </div>
             <ProfileSetupForm
                universities={catalog.universities}
                colleges={catalog.colleges}
                majors={catalog.majors}
                yearLevels={catalog.yearLevels}
                initialValues={{
                    universityId: profile?.university_id ?? null,
                    collegeId: profile?.college_id ?? null,
                    majorId: profile?.major_id ?? null,
                    yearLevelId: profile?.year_level_id ?? null,
                    preferredLanguage: profile?.preferred_language === "ar" ? "ar" : "en",
                }}
            />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 outline-none">
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Moon className="size-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t("appearance.title")}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{t("appearance.theme")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t("appearance.themeSubtitle")}</p>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Globe className="size-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">{t("localization.title")}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{t("localization.language")}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{t("localization.languageSubtitle")}</p>
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </AppShell>
  );
}
