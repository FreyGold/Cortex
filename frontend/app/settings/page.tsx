import {
  Globe,
  GraduationCap,
  Moon,
  Palette,
  Settings2,
  User,
  Users,
  Wand2,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ProfileSetupForm } from "@/components/profile/profile-setup-form";
import { ProfileStatusCard } from "@/components/profile/profile-status-card";
import { AIIntegrationForm } from "@/components/settings/ai-integration-form";
import { WorkspaceTeam } from "@/components/settings/workspace-team";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServerSession } from "@/lib/auth";
import { getCatalogData } from "@/lib/data/catalog";

export default async function SettingsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
    <div className="w-full h-full overflow-y-auto custom-scrollbar flex-1">
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground/90">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground/80 max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {(!tab || tab === "profile") && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">
                Personal Profile
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage your identity and how others see you in the workspace.
              </p>
            </div>
            <ProfileStatusCard showEditLink={false} />
          </div>
        )}

        {tab === "team" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">
                Workspace & Collaboration
              </h2>
              <p className="text-sm text-muted-foreground">
                Organize your study groups and invite collaborators to your
                workspaces.
              </p>
            </div>
            <WorkspaceTeam />
          </div>
        )}

        {tab === "ai" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">
                AI Integration
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize your AI experience and manage your personal API keys.
              </p>
            </div>
            <AIIntegrationForm />
          </div>
        )}

        {tab === "academic" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">
                Academic Path
              </h2>
              <p className="text-sm text-muted-foreground">
                Keep your university details up to date to get the best resource
                recommendations.
              </p>
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
                preferredLanguage:
                  profile?.preferred_language === "ar" ? "ar" : "en",
              }}
            />
          </div>
        )}

        {tab === "preferences" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight mb-1">
                Application Settings
              </h2>
              <p className="text-sm text-muted-foreground">
                Customize your viewing experience, interface theme, and language preferences.
              </p>
            </div>
            <div className="grid gap-6">
              <div className="rounded-2xl border border-border/40 bg-card p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Palette className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Interface Appearance</h3>
                      <p className="text-sm text-muted-foreground/80">
                        Choose between light/dark mode and select your custom visual theme.
                      </p>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
                
                <div className="border-t border-border/40 pt-6">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Predefined Themes</h4>
                  <ThemeSwitcher />
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-card p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Globe className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {t("localization.language")}
                    </h3>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {t("localization.languageSubtitle")}
                    </p>
                  </div>
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
    </div>
  );
}
