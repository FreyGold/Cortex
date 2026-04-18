import {
  ArrowRight,
  Book,
  Calendar,
  Ghost,
  GraduationCap,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import { CourseDialog } from "@/components/data/course-dialog";
import { Badge } from "@/components/ui/badge";
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
  const isVerifiedOrAdmin =
    session?.profile?.role === "admin" ||
    session?.profile?.is_verified === true;

  // Determine default values
  const defaultUniversity = universities.find(
    (u) => u.slug === "menofia" || u.name_en.toLowerCase().includes("menofia"),
  );
  const defaultCollege = colleges.find(
    (c) => c.slug === "fee" || c.name_en.toLowerCase().includes("electronic"),
  );

  const shouldUseDefaultFilters =
    Object.keys(params).length === 0 && defaultUniversity && defaultCollege;

  const selectedUniversityId =
    params.university ??
    (shouldUseDefaultFilters ? defaultUniversity.id : null);
  const selectedCollegeId =
    params.college ?? (shouldUseDefaultFilters ? defaultCollege.id : null);
  const selectedMajorId = params.major ?? null;
  const selectedYearId = params.year ?? null;
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
      ? { label: "University", value: selectedUniversity.name_en }
      : null,
    selectedCollege
      ? { label: "College", value: selectedCollege.name_en }
      : null,
    selectedMajor ? { label: "Major", value: selectedMajor.name_en } : null,
    selectedYear
      ? { label: "Year", value: `Year ${selectedYear.level}` }
      : null,
    rawQuery ? { label: "Search", value: rawQuery } : null,
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
    <AppShell>
      <main className="py-8 md:py-12">
        <div className="container mx-auto max-w-[1320px] space-y-8 px-4 md:px-6 lg:px-8">
          <header className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {t("title")}
                </h1>
                <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <GraduationCap className="size-4 text-foreground/80" />
                  {majors.length} {t("stats.majors")}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Calendar className="size-4 text-foreground/80" />
                  {yearLevels.length} {t("stats.yearLevels")}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Book className="size-4 text-foreground/80" />
                  {filteredCourses.length} {t("stats.matchingCourses")}
                </span>
              </div>
            </div>
            {isVerifiedOrAdmin && (
              <CourseDialog
                colleges={colleges}
                majors={majors}
                yearLevels={yearLevels}
              />
            )}
          </header>

          <section className="grid gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
            <aside className="lg:sticky lg:top-24">
              <Card className="border-border/70 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    {t("filters.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
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
                </CardContent>
              </Card>
            </aside>

            <div className="space-y-5">
              {activeFilterTokens.length > 0 || hasSearchQuery ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeFilterTokens.map((item) => (
                      <div
                        key={`${item.label}-${item.value}`}
                        className="inline-flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1.5"
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="max-w-[240px] truncate text-sm font-medium text-foreground">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {hasSearchQuery ? (
                    <p className="text-xs text-muted-foreground">
                      Global search is active. Results ignore
                      university/college/major/year filters while searching.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {filteredCourses.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                  <CardHeader className="text-center py-12">
                    <Ghost className="mx-auto size-12 text-muted-foreground/50 mb-4" />
                    <CardTitle>{t("empty.title")}</CardTitle>
                    <CardDescription>{t("empty.description")}</CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCourses.map((course) => {
                    const majorItem = majorsById.get(course.major_id);
                    const yearItem = course.year_level_id
                      ? yearLevelsById.get(course.year_level_id)
                      : null;

                    return (
                      <Link
                        key={course.id}
                        href={`/data/${course.id}`}
                        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                      >
                        <Card className="flex h-full flex-col hover:border-primary/50 transition-colors">
                          <CardHeader className="space-y-2 pb-4">
                            <div className="flex items-center gap-2">
                              {course.code && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {course.code}
                                </Badge>
                              )}
                              {yearItem && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  Y{yearItem.level}
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base line-clamp-2">
                              {course.name_en}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 text-xs">
                              {course.description || t("courses.noDescription")}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="mt-auto pt-0 pb-4 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground truncate">
                              {majorItem?.name_en ?? "No Major"}
                            </span>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
