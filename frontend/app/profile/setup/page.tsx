import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProfileSetupForm } from "@/components/profile/profile-setup-form";
import { Button } from "@/components/ui/button";
import { getCatalogData } from "@/lib/data/catalog";
import { getServerSession } from "@/lib/auth";

export default async function ProfileSetupPage() {
  const t = await getTranslations("profileSetup");
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login?redirectTo=/profile/setup");
  }

  const [catalog] = await Promise.all([
    getCatalogData(),
  ]);

  const profile = session.profile;

  return (
    <AppShell>
      <main className="container mx-auto max-w-2xl px-4 py-10 md:py-16">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            {t("verificationHint")}
          </p>
          <Button asChild variant="secondary" size="sm">
            <Link href="/profile">{t("verificationLink")}</Link>
          </Button>
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
      </main>
    </AppShell>
  );
}
