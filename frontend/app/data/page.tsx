import {
  ArrowRight,
  Book,
  Calendar,
  Ghost,
  GraduationCap,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCatalogData } from "@/lib/data/catalog";
import { DataFilters } from "./data-filters";
import { CourseList } from "@/components/data/course-list";
import { CourseDialog } from "@/components/data/course-dialog";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isVerifiedOrAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_verified")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && (profile.role === "admin" || profile.is_verified)) {
      isVerifiedOrAdmin = true;
    }
  }

  // Determine default values
  const defaultUniversity = universities.find(
    (u) => u.slug === "menofia" || u.name_en.toLowerCase().includes("menofia"),
  );
  const defaultCollege = colleges.find(
    (c) => c.slug === "fee" || c.name_en.toLowerCase().includes("electronic"),
  );

  // If no params at all, redirect to default
  if (Object.keys(params).length === 0 && defaultUniversity && defaultCollege) {
    redirect(
      `/data?university=${defaultUniversity.id}&college=${defaultCollege.id}`,
    );
  }

  const selectedUniversityId = params.university ?? null;
  const selectedCollegeId = params.college ?? null;
  const selectedMajorId = params.major ?? null;
  const selectedYearId = params.year ?? null;
  const rawQuery = params.q?.trim() ?? "";
  const normalizedQuery = rawQuery.toLowerCase();

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

  const filteredCourses = courses.filter((course) => {
    const majorItem = majors.find((m) => m.id === course.major_id);
    const collegeItem = majorItem
      ? colleges.find((c) => c.id === majorItem.college_id)
      : null;

    const universityMatch =
      !selectedUniversityId ||
      collegeItem?.university_id === selectedUniversityId;
    const collegeMatch =
      !selectedCollegeId || majorItem?.college_id === selectedCollegeId;
    const majorMatch = !selectedMajorId || course.major_id === selectedMajorId;
    const yearMatch =
      !selectedYearId || course.year_level_id === selectedYearId;
    const searchMatch =
      !normalizedQuery ||
      course.name_en.toLowerCase().includes(normalizedQuery) ||
      (course.code?.toLowerCase().includes(normalizedQuery) ?? false);

    return (
      universityMatch && collegeMatch && majorMatch && yearMatch && searchMatch
    );
  });

  const majorsById = new Map(majors.map((item) => [item.id, item]));
  const yearLevelsById = new Map(yearLevels.map((item) => [item.id, item]));

  return (
    <AppShell>
      <main className="py-8 md:py-12">
        <div className="container mx-auto space-y-8 px-4 md:space-y-10">
          <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {t("title")}
                </h1>
                <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Badge variant="outline" className="px-3 py-1 font-medium">
                  <GraduationCap className="mr-2 size-4" />
                  {majors.length} {t("stats.majors")}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 font-medium">
                  <Calendar className="mr-2 size-4" />
                  {yearLevels.length} {t("stats.yearLevels")}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 font-medium">
                  <Book className="mr-2 size-4" />
                  {filteredCourses.length} {t("stats.matchingCourses")}
                </Badge>
              </div>
            </div>
            {isVerifiedOrAdmin && (
              <CourseDialog colleges={colleges} majors={majors} yearLevels={yearLevels} />
            )}
          </header>

          <section className="grid gap-6 lg:grid-cols-[280px_1fr] xl:gap-8 lg:items-start">
            <aside className="lg:sticky lg:top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">
                    {t("filters.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
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

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {selectedUniversity && (
                  <Badge variant="outline">
                    University: {selectedUniversity.name_en}
                  </Badge>
                )}
                {selectedCollege && (
                  <Badge variant="outline">
                    College: {selectedCollege.name_en}
                  </Badge>
                )}
                {selectedMajor && (
                  <Badge variant="outline">
                    Major: {selectedMajor.name_en}
                  </Badge>
                )}
                {selectedYear && (
                  <Badge variant="outline">Year {selectedYear.level}</Badge>
                )}
                {rawQuery && (
                  <Badge variant="outline">Search: "{rawQuery}"</Badge>
                )}
              </div>

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
