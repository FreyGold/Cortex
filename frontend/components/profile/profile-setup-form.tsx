"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setupProfile } from "@/lib/api/profile";
import { getAccessToken } from "@/lib/supabase/client";

type University = { id: string; name_en: string };
type College = { id: string; university_id: string; name_en: string };
type Major = { id: string; college_id: string; name_en: string };
type YearLevel = { id: string; level: number; name_en: string };

type ProfileSetupFormProps = {
  universities: University[];
  colleges: College[];
  majors: Major[];
  yearLevels: YearLevel[];
  initialValues: {
    universityId: string | null;
    collegeId: string | null;
    majorId: string | null;
    yearLevelId: string | null;
    preferredLanguage: "en" | "ar";
  };
};

export function ProfileSetupForm({
  universities,
  colleges,
  majors,
  yearLevels,
  initialValues,
}: ProfileSetupFormProps) {
  const t = useTranslations("profileSetup");
  const router = useRouter();

  const [universityId, setUniversityId] = useState(
    initialValues.universityId ?? "",
  );
  const [collegeId, setCollegeId] = useState(initialValues.collegeId ?? "");
  const [majorId, setMajorId] = useState(initialValues.majorId ?? "");
  const [yearLevelId, setYearLevelId] = useState(
    initialValues.yearLevelId ?? "",
  );
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "ar">(
    initialValues.preferredLanguage,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredColleges = useMemo(
    () => colleges.filter((item) => item.university_id === universityId),
    [colleges, universityId],
  );
  const filteredMajors = useMemo(
    () => majors.filter((item) => item.college_id === collegeId),
    [majors, collegeId],
  );

  const onUniversityChange = (value: string) => {
    setUniversityId(value);
    setCollegeId("");
    setMajorId("");
  };

  const onCollegeChange = (value: string) => {
    setCollegeId(value);
    setMajorId("");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("You must be signed in to save your profile.");
      }

      await setupProfile(accessToken, {
        universityId: universityId || null,
        collegeId: collegeId || null,
        majorId: majorId || null,
        yearLevelId: yearLevelId || null,
        preferredLanguage,
      });

      router.push("/notes");
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? t("errors.generic"));
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-none border-border/60">
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="university">{t("fields.university")}</Label>
              <Select value={universityId} onValueChange={onUniversityChange}>
                <SelectTrigger id="university" className="h-10">
                  <SelectValue placeholder={t("placeholders.university")} />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="college">{t("fields.college")}</Label>
              <Select
                value={collegeId}
                onValueChange={onCollegeChange}
                disabled={!universityId}
              >
                <SelectTrigger id="college" className="h-10">
                  <SelectValue placeholder={t("placeholders.college")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredColleges.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">{t("fields.major")}</Label>
              <Select
                value={majorId}
                onValueChange={setMajorId}
                disabled={!collegeId}
              >
                <SelectTrigger id="major" className="h-10">
                  <SelectValue placeholder={t("placeholders.major")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredMajors.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year-level">{t("fields.yearLevel")}</Label>
              <Select value={yearLevelId} onValueChange={setYearLevelId}>
                <SelectTrigger id="year-level" className="h-10">
                  <SelectValue placeholder={t("placeholders.yearLevel")} />
                </SelectTrigger>
                <SelectContent>
                  {yearLevels.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {t("yearOption", { level: item.level })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="preferred-language">
                {t("fields.preferredLanguage")}
              </Label>
              <Select
                value={preferredLanguage}
                onValueChange={(val: "en" | "ar") => setPreferredLanguage(val)}
              >
                <SelectTrigger id="preferred-language" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("language.en")}</SelectItem>
                  <SelectItem value="ar">{t("language.ar")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="size-3 text-primary" />
              Your academic context is used to personalize your experience.
              <Link
                href="/settings"
                className="font-medium text-primary hover:underline"
              >
                {t("verificationLink")}
              </Link>
            </p>
            <Button
              type="submit"
              disabled={saving || !universityId || !majorId}
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t("save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
