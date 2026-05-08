import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProfileSetupForm } from "@/components/profile/profile-setup-form";
import { ProfileStatusCard } from "@/components/profile/profile-status-card";
import { WorkspaceTeam } from "@/components/settings/workspace-team";
import { AIIntegrationForm } from "@/components/settings/ai-integration-form";
import { getCatalogData } from "@/lib/data/catalog";
import { getServerSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, GraduationCap, Settings2, Globe, Moon, Users, Wand2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function SettingsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab as string | undefined;
  const t = await getTranslations("settingsPage");
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/settings");
  }

  const [catalog] = await Promise.all([getCatalogData()]);
  const profile = session.profile;

  return (
      <main className="container mx-auto max-w-6xl px-4 py-8 md:py-16 flex-1 overflow-y-auto custom-scrollbar">
        <div className="mb-10 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground/90">{t("title")}</h1>
          <p className="text-base text-muted-foreground/80 max-w-2xl">
            {t("subtitle")}
          </p>
        </div>

        <Tabs defaultValue={tab || "profile"} className="flex flex-col md:flex-row gap-8 lg:gap-12" orientation="vertical">
          <aside className="w-full md:w-64 lg:w-72 shrink-0">
            <TabsList className="flex flex-row md:flex-col h-auto w-full bg-transparent p-0 justify-start overflow-x-auto md:overflow-visible no-scrollbar border-b md:border-b-0 md:border-r border-border/40 pb-2 md:pb-0 md:pr-4" variant="line">
              <TabsTrigger value="profile" className="w-auto md:w-full justify-start gap-3 py-3 px-4 rounded-xl transition-all">
                <User className="size-4" />
                <span className="font-medium text-[15px]">{t("tabs.profile")}</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="w-auto md:w-full justify-start gap-3 py-3 px-4 rounded-xl transition-all">
                <Users className="size-4" />
                <span className="font-medium text-[15px]">Workspace & Team</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="w-auto md:w-full justify-start gap-3 py-3 px-4 rounded-xl transition-all">
                <Wand2 className="size-4" />
                <span className="font-medium text-[15px]">AI Integration</span>
              </TabsTrigger>
              <TabsTrigger value="academic" className="w-auto md:w-full justify-start gap-3 py-3 px-4 rounded-xl transition-all">
                <GraduationCap className="size-4" />
                <span className="font-medium text-[15px]">{t("tabs.academic")}</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="w-auto md:w-full justify-start gap-3 py-3 px-4 rounded-xl transition-all">
                <Settings2 className="size-4" />
                <span className="font-medium text-[15px]">{t("tabs.preferences")}</span>
              </TabsTrigger>
            </TabsList>
          </aside>

          <div className="flex-1 min-w-0">
            <TabsContent value="profile" className="mt-0 space-y-8 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-1">Personal Profile</h2>
                  <p className="text-sm text-muted-foreground">Manage your identity and how others see you in the workspace.</p>
                </div>
                <ProfileStatusCard showEditLink={false} />
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-0 space-y-8 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-1">Workspace & Collaboration</h2>
                  <p className="text-sm text-muted-foreground">Organize your study groups and invite collaborators to your workspaces.</p>
                </div>
                <WorkspaceTeam />
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-0 space-y-8 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-1">AI Integration</h2>
                  <p className="text-sm text-muted-foreground">Customize your AI experience and manage your personal API keys.</p>
                </div>
                <AIIntegrationForm />
              </div>
            </TabsContent>

            <TabsContent value="academic" className="mt-0 space-y-8 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-1">Academic Path</h2>
                  <p className="text-sm text-muted-foreground">Keep your university details up to date to get the best resource recommendations.</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-muted/20 p-6 flex items-start gap-4">
                    <GraduationCap className="size-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed text-muted-foreground/90 italic">
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
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="mt-0 space-y-8 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight mb-1">Application Settings</h2>
                  <p className="text-sm text-muted-foreground">Customize your viewing experience and language preferences.</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/40 bg-card p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <Moon className="size-5" />
                            </div>
                            <h3 className="text-lg font-semibold">{t("appearance.theme")}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground/80 leading-relaxed">{t("appearance.themeSubtitle")}</p>
                        <ThemeToggle />
                    </div>

                    <div className="rounded-2xl border border-border/40 bg-card p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <Globe className="size-5" />
                            </div>
                            <h3 className="text-lg font-semibold">{t("localization.language")}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground/80 leading-relaxed">{t("localization.languageSubtitle")}</p>
                        <LanguageSwitcher />
                    </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>
  );
}
