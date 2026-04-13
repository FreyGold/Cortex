"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CortexButton } from "@/components/ui/cortex-button";

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

  const [universityId, setUniversityId] = useState(initialValues.universityId ?? "");
  const [collegeId, setCollegeId] = useState(initialValues.collegeId ?? "");
  const [majorId, setMajorId] = useState(initialValues.majorId ?? "");
  const [yearLevelId, setYearLevelId] = useState(initialValues.yearLevelId ?? "");
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

    const response = await fetch("/api/profile/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        universityId: universityId || null,
        collegeId: collegeId || null,
        majorId: majorId || null,
        yearLevelId: yearLevelId || null,
        preferredLanguage,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    if (!response.ok) {
      setSaving(false);
      setError(payload.error ?? t("errors.generic"));
      return;
    }

    router.push("/notes");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="university">
          {t("fields.university")}
        </label>
        <select
          id="university"
          value={universityId}
          onChange={(event) => onUniversityChange(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">{t("placeholders.university")}</option>
          {universities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="college">
          {t("fields.college")}
        </label>
        <select
          id="college"
          value={collegeId}
          onChange={(event) => onCollegeChange(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
          disabled={!universityId}
        >
          <option value="">{t("placeholders.college")}</option>
          {filteredColleges.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="major">
          {t("fields.major")}
        </label>
        <select
          id="major"
          value={majorId}
          onChange={(event) => setMajorId(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
          disabled={!collegeId}
        >
          <option value="">{t("placeholders.major")}</option>
          {filteredMajors.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="year-level">
          {t("fields.yearLevel")}
        </label>
        <select
          id="year-level"
          value={yearLevelId}
          onChange={(event) => setYearLevelId(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">{t("placeholders.yearLevel")}</option>
          {yearLevels.map((item) => (
            <option key={item.id} value={item.id}>
              {t("yearOption", { level: item.level })}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold" htmlFor="preferred-language">
          {t("fields.preferredLanguage")}
        </label>
        <select
          id="preferred-language"
          value={preferredLanguage}
          onChange={(event) => setPreferredLanguage(event.target.value as "en" | "ar")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="en">{t("language.en")}</option>
          <option value="ar">{t("language.ar")}</option>
        </select>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <CortexButton type="submit" loading={saving}>
          {t("save")}
        </CortexButton>
      </div>
    </form>
  );
}
