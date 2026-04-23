import { redirect } from "next/navigation";
import {
  ArrowRight,
  Book,
  Calendar,
  Ghost,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import { CourseDialog } from "@/components/data/course-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerSession } from "@/lib/auth";
import { getCatalogData } from "@/lib/data/catalog";
import { DataFilters } from "./data-filters";

type PageProps = {
  searchParams: Promise<{
    university?: string;
    college?: string;
    major?: string;
    year?: string;
    q?: string;
  }>;
};

export const metadata = {
  title: "Data Browser | Cortex",
  description:
    "Browse universities, colleges, majors, years, courses, and resources.",
};

export default async function DataPage({ searchParams }: PageProps) {
  const t = await getTranslations("dataPage");
  const params = await searchParams;
  const { universities, colleges, majors, yearLevels, courses } =
    await getCatalogData();

  const session = await getServerSession();
  const isAdmin = session?.profile?.role === "admin";

  if (Object.keys(params).length === 0) {
    const defaultUniversity = universities.find(
      (u) => u.id === session?.profile?.university_id || u.slug === "menofia" || u.name_en.toLowerCase().includes("menofia"),
    );
    const defaultCollege = colleges.find(
      (c) => c.id === session?.profile?.college_id || c.slug === "fee" || c.name_en.toLowerCase().includes("electronic"),
    );
    const defaultMajor = majors.find(
      (m) => m.id === session?.profile?.major_id,
    );

    const redirectParams = new URLSearchParams();
    if (defaultUniversity) redirectParams.set("university", defaultUniversity.id);
    if (defaultCollege) redirectParams.set("college", defaultCollege.id);
    if (defaultMajor) redirectParams.set("major", defaultMajor.id);

    if (redirectParams.toString()) {
      redirect(`/data?${redirectParams.toString()}`);
    }
  }

  const selectedUniversityId = params.university === "all" ? null : (params.university ?? null);
  const selectedCollegeId = params.college === "all" ? null : (params.college ?? null);
  const selectedMajorId = params.major === "all" ? null : (params.major ?? null);
  const selectedYearId = params.year === "all" ? null : (params.year ?? null);
  const rawQuery = params.q?.trim() ?? "";
  const normalizedQuery = rawQuery.toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;

  const selectedUniversity = selectedUniversityId
    ? (universities.find((u) => u.id === selectedUniversityId) ?? null)
    : null;
  const selectedCollege = selectedCollegeId
    ? (colleges.find((c) => c.id === selectedCollegeId) ?? null)
    : null;
  const selectedMajor = selectedMajorId
    ? (majors.find((majorItem) => majorItem.id === selectedMajorId) ?? null)
    : null;
  const selectedYear = selectedYearId
    ? (yearLevels.find((yearItem) => yearItem.id === selectedYearId) ?? null)
    : null;
  const activeFilterTokens = [
    selectedUniversity
      ? { label: t("filters.filterLabels.university"), value: selectedUniversity.name_en }
      : null,
    selectedCollege
      ? { label: t("filters.filterLabels.college"), value: selectedCollege.name_en }
      : null,
    selectedMajor ? { label: t("filters.filterLabels.major"), value: selectedMajor.name_en } : null,
    selectedYear
      ? { label: t("filters.filterLabels.year"), value: t("filters.year", { level: selectedYear.level }) }
      : null,
    rawQuery ? { label: t("filters.filterLabels.search"), value: rawQuery } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const majorsById = new Map(majors.map((item) => [item.id, item]));
  const collegesById = new Map(colleges.map((item) => [item.id, item]));
  const yearLevelsById = new Map(yearLevels.map((item) => [item.id, item]));
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const getSearchScore = (course: (typeof courses)[number]) => {
    const name = course.name_en.toLowerCase();
    const code = course.code?.toLowerCase() ?? "";
    const description = course.description?.toLowerCase() ?? "";

    let score = 0;
    if (name.includes(normalizedQuery)) score += 24;
    if (code.includes(normalizedQuery)) score += 20;
    if (description.includes(normalizedQuery)) score += 8;

    for (const token of queryTokens) {
      if (name.includes(token)) score += 6;
      if (code.includes(token)) score += 5;
      if (description.includes(token)) score += 2;
    }

    return score;
  };

  const filteredCourses = hasSearchQuery
    ? courses
        .map((course) => ({
          course,
          score: getSearchScore(course),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.course)
    : courses.filter((course) => {
        const majorItem = majorsById.get(course.major_id);
        const collegeItem = majorItem
          ? collegesById.get(majorItem.college_id)
          : null;

        const universityMatch =
          !selectedUniversityId ||
          collegeItem?.university_id === selectedUniversityId;
        const collegeMatch =
          !selectedCollegeId || majorItem?.college_id === selectedCollegeId;
        const majorMatch =
          !selectedMajorId || course.major_id === selectedMajorId;
        const yearMatch =
          !selectedYearId || course.year_level_id === selectedYearId;

        return universityMatch && collegeMatch && majorMatch && yearMatch;
      });

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto space-y-6 px-6 py-8 md:py-12">
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                {t("header")}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">{t("subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground/60">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="size-3.5" />
                {majors.length} {t("stats.majors")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                {yearLevels.length} {t("stats.yearLevels")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Book className="size-3.5" />
                {filteredCourses.length} {t("stats.matchingCourses")}
              </span>
            </div>
          </div>
          {isAdmin && (
            <CourseDialog
              colleges={colleges}
              majors={majors}
              yearLevels={yearLevels}
            />
          )}
        </header>

        <section className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside className="lg:sticky lg:top-4">
            <div className="rounded-3xl border border-border/40 bg-card/30 p-1">
               <div className="px-4 py-3 border-b border-border/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">{t("filtersTitle")}</span>
               </div>
               <div className="p-2 pt-4">
                  <DataFilters
                    universities={universities}
                    colleges={colleges}
                    majors={majors}
                    yearLevels={yearLevels}
                    selectedUniversityId={selectedUniversityId}
                    selectedCollegeId={selectedCollegeId}
                    selectedMajorId={selectedMajorId}
                    selectedYearId={selectedYearId}
                    q={rawQuery}
                  />
               </div>
            </div>
          </aside>

          <div className="space-y-6">
            {activeFilterTokens.length > 0 || hasSearchQuery ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilterTokens.map((item) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-1.5 transition-all hover:bg-muted/30"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/50">
                        {item.label}
                      </span>
                      <span className="max-w-[200px] truncate text-xs font-semibold text-foreground">
                        {item.value}
                      </span>
                    </div>
                  ))}
                  {(activeFilterTokens.length > 0 || hasSearchQuery) && (
                     <Button asChild variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-muted-foreground/40 hover:text-foreground">
                        <Link href="/data">{t("filters.clearAll")}</Link>
                     </Button>
                  )}
                </div>
              </div>
            ) : null}

            {filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 rounded-3xl border border-dashed border-border/10 bg-muted/5">
                <div className="size-16 rounded-3xl bg-muted/10 flex items-center justify-center">
                  <Ghost className="size-8 text-muted-foreground/20" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-muted-foreground">{t("empty.title")}</p>
                  <p className="text-sm text-muted-foreground/40">{t("empty.description")}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 pb-20">
                {filteredCourses.map((course) => {
                  const majorItem = majorsById.get(course.major_id);
                  const yearItem = course.year_level_id
                    ? yearLevelsById.get(course.year_level_id)
                    : null;

                  return (
                    <Link
                      key={course.id}
                      href={`/data/${course.id}`}
                      className="block h-full group"
                    >
                      <div className="flex h-full flex-col p-6 rounded-3xl border border-border/40 bg-card hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4">
                          {course.code && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] font-bold h-5 px-1.5 bg-muted/50 text-muted-foreground border-none"
                            >
                              {course.code}
                            </Badge>
                          )}
                          {yearItem && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold h-5 px-1.5 border-border/40 text-muted-foreground/40"
                            >
                              Y{yearItem.level}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          {course.name_en}
                        </h3>
                        <p className="text-sm text-muted-foreground/60 leading-relaxed line-clamp-3 mb-6 flex-1">
                          {course.description || t("courses.noDescription")}
                        </p>
                        <div className="mt-auto pt-4 border-t border-border/5 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/30 truncate">
                            {majorItem?.name_en ?? "No Major"}
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
