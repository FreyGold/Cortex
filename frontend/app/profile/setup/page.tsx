import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import { ProfileSetupForm } from "@/components/profile/profile-setup-form";
import {
  CortexCard,
  CortexCardContent,
  CortexCardDescription,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileSetupPage() {
  const t = await getTranslations("profileSetup");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/profile/setup");
  }

  const [universitiesRes, collegesRes, majorsRes, yearLevelsRes, profileRes] =
    await Promise.all([
      supabase.from("universities").select("id,name_en").eq("is_active", true).order("name_en"),
      supabase
        .from("colleges")
        .select("id,university_id,name_en")
        .eq("is_active", true)
        .order("name_en"),
      supabase
        .from("majors")
        .select("id,college_id,name_en")
        .eq("is_active", true)
        .order("sort_order")
        .order("name_en"),
      supabase.from("year_levels").select("id,level,name_en").order("level"),
      supabase
        .from("profiles")
        .select("university_id,college_id,major_id,year_level_id,preferred_language")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  if (
    universitiesRes.error ||
    collegesRes.error ||
    majorsRes.error ||
    yearLevelsRes.error ||
    profileRes.error
  ) {
    const message =
      universitiesRes.error?.message ||
      collegesRes.error?.message ||
      majorsRes.error?.message ||
      yearLevelsRes.error?.message ||
      profileRes.error?.message ||
      "Unknown data loading error";
    throw new Error(`Failed to load profile setup data: ${message}`);
  }

  const profile = profileRes.data;

  return (
    <AppShell>
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <CortexCard>
          <CortexCardHeader className="space-y-2">
            <CortexCardTitle className="text-2xl">{t("title")}</CortexCardTitle>
            <CortexCardDescription>{t("subtitle")}</CortexCardDescription>
          </CortexCardHeader>
          <CortexCardContent>
            <ProfileSetupForm
              universities={universitiesRes.data ?? []}
              colleges={collegesRes.data ?? []}
              majors={majorsRes.data ?? []}
              yearLevels={yearLevelsRes.data ?? []}
              initialValues={{
                universityId: profile?.university_id ?? null,
                collegeId: profile?.college_id ?? null,
                majorId: profile?.major_id ?? null,
                yearLevelId: profile?.year_level_id ?? null,
                preferredLanguage: profile?.preferred_language === "ar" ? "ar" : "en",
              }}
            />
          </CortexCardContent>
        </CortexCard>
      </main>
    </AppShell>
  );
}
