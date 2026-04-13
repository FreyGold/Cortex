import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { CortexButton } from "@/components/ui/cortex-button";
import {
  CortexCard,
  CortexCardContent,
  CortexCardDescription,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";
import { getCatalogData } from "@/lib/data/catalog";
import { getTranslations } from "next-intl/server";

type PageProps = {
  searchParams: Promise<{
    major?: string;
    year?: string;
    q?: string;
  }>;
};

export const metadata = {
  title: "Data Browser | Cortex",
  description: "Browse majors, years, courses, and resources.",
};

type Filters = {
  major?: string | null;
  year?: string | null;
  q?: string | null;
};

function buildDataHref(filters: Filters) {
  const params = new URLSearchParams();

  if (filters.major) params.set("major", filters.major);
  if (filters.year) params.set("year", filters.year);
  if (filters.q) params.set("q", filters.q);

  const query = params.toString();
  return query ? `/data?${query}` : "/data";
}

export default async function DataPage({ searchParams }: PageProps) {
  const t = await getTranslations("dataPage");
  const { major, year, q } = await searchParams;
  const selectedMajorId = major ?? null;
  const selectedYearId = year ?? null;
  const rawQuery = q?.trim() ?? "";
  const normalizedQuery = rawQuery.toLowerCase();

  const { majors, yearLevels, courses } = await getCatalogData();

  const coursesByMajor = new Map<string, number>();
  for (const course of courses) {
    coursesByMajor.set(
      course.major_id,
      (coursesByMajor.get(course.major_id) ?? 0) + 1,
    );
  }

  const selectedMajor = selectedMajorId
    ? majors.find((majorItem) => majorItem.id === selectedMajorId) ?? null
    : null;
  const selectedYear = selectedYearId
    ? yearLevels.find((yearItem) => yearItem.id === selectedYearId) ?? null
    : null;

  const filteredCourses = courses.filter((course) => {
    const majorMatch = !selectedMajorId || course.major_id === selectedMajorId;
    const yearMatch = !selectedYearId || course.year_level_id === selectedYearId;
    const searchMatch =
      !normalizedQuery ||
      course.name_en.toLowerCase().includes(normalizedQuery) ||
      (course.code?.toLowerCase().includes(normalizedQuery) ?? false);

    return majorMatch && yearMatch && searchMatch;
  });

  const majorsById = new Map(majors.map((item) => [item.id, item]));
  const yearLevelsById = new Map(yearLevels.map((item) => [item.id, item]));
  const hasActiveFilters = Boolean(selectedMajorId || selectedYearId || rawQuery);

  return (
    <AppShell>
      <main className="relative isolate overflow-hidden py-8 md:py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(91,76,219,0.14),transparent_55%)]" />
        <div className="absolute inset-x-0 top-16 h-72 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.12),transparent_50%)]" />
      </div>

      <div className="container mx-auto space-y-8 px-4 md:space-y-10">
        <header className="space-y-4">
          <Badge variant="brand">{t("badge")}</Badge>
          <h1 className="max-w-4xl text-balance text-[clamp(2rem,4vw,3.35rem)] font-bold leading-[1.02] tracking-[-0.03em]">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-[clamp(1rem,1.6vw,1.12rem)] text-muted-foreground">
            {t("subtitle")}
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <CortexCard level="flat" className="bg-card/85 backdrop-blur-sm">
              <CortexCardContent className="space-y-1 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("stats.majors")}
                </p>
                <p className="text-2xl font-bold tracking-tight">{majors.length}</p>
              </CortexCardContent>
            </CortexCard>
            <CortexCard level="flat" className="bg-card/85 backdrop-blur-sm">
              <CortexCardContent className="space-y-1 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("stats.yearLevels")}
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {yearLevels.length}
                </p>
              </CortexCardContent>
            </CortexCard>
            <CortexCard level="flat" className="bg-card/85 backdrop-blur-sm">
              <CortexCardContent className="space-y-1 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("stats.matchingCourses")}
                </p>
                <p className="text-2xl font-bold tracking-tight">
                  {filteredCourses.length}
                </p>
              </CortexCardContent>
            </CortexCard>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(260px,310px)_1fr] xl:gap-8">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <CortexCard className="bg-card/95 backdrop-blur-sm">
              <CortexCardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CortexCardTitle className="text-heading">
                      {t("filters.title")}
                    </CortexCardTitle>
                    <CortexCardDescription>{t("filters.helper")}</CortexCardDescription>
                  </div>
                  {hasActiveFilters ? (
                    <Link href="/data" className="shrink-0">
                      <CortexButton variant="ghost" size="sm">
                        {t("filters.clearAll")}
                      </CortexButton>
                    </Link>
                  ) : null}
                </div>
              </CortexCardHeader>
              <CortexCardContent className="space-y-6">
                <form action="/data" method="get" className="space-y-2">
                  {selectedMajorId ? (
                    <input type="hidden" name="major" value={selectedMajorId} />
                  ) : null}
                  {selectedYearId ? (
                    <input type="hidden" name="year" value={selectedYearId} />
                  ) : null}
                  <label
                    htmlFor="data-search"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t("filters.searchLabel")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="data-search"
                      name="q"
                      defaultValue={rawQuery}
                      placeholder={t("filters.searchPlaceholder")}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <CortexButton type="submit" variant="outline" size="sm">
                      {t("filters.apply")}
                    </CortexButton>
                  </div>
                </form>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("filters.majorLabel")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildDataHref({
                        year: selectedYearId,
                        q: rawQuery || null,
                      })}
                    >
                      <CortexButton
                        size="sm"
                        variant={!selectedMajorId ? "primary" : "outline"}
                      >
                        {t("filters.allMajors")}
                      </CortexButton>
                    </Link>
                    {majors.map((majorItem) => {
                      const isSelected = majorItem.id === selectedMajorId;
                      return (
                        <Link
                          key={majorItem.id}
                          href={buildDataHref({
                            major: majorItem.id,
                            year: selectedYearId,
                            q: rawQuery || null,
                          })}
                        >
                          <CortexButton
                            size="sm"
                            variant={isSelected ? "primary" : "outline"}
                            className="group"
                          >
                            <span>{majorItem.name_en}</span>
                            <span className="ms-1 text-xs opacity-70">
                              ({coursesByMajor.get(majorItem.id) ?? 0})
                            </span>
                          </CortexButton>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("filters.yearLabel")}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildDataHref({
                        major: selectedMajorId,
                        q: rawQuery || null,
                      })}
                    >
                      <CortexButton
                        size="sm"
                        variant={!selectedYearId ? "primary" : "outline"}
                      >
                        {t("filters.allYears")}
                      </CortexButton>
                    </Link>
                    {yearLevels.map((yearItem) => (
                      <Link
                        key={yearItem.id}
                        href={buildDataHref({
                          major: selectedMajorId,
                          year: yearItem.id,
                          q: rawQuery || null,
                        })}
                      >
                        <CortexButton
                          size="sm"
                          variant={
                            selectedYearId === yearItem.id ? "primary" : "outline"
                          }
                        >
                          {t("filters.year", { level: yearItem.level })}
                        </CortexButton>
                      </Link>
                    ))}
                  </div>
                </div>
              </CortexCardContent>
            </CortexCard>
          </aside>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/80 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">
                {t("results.summary", { count: filteredCourses.length })}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                {selectedMajor ? (
                  <Badge variant="brand">
                    {t("results.majorChip", { value: selectedMajor.name_en })}
                  </Badge>
                ) : null}
                {selectedYear ? (
                  <Badge variant="synapse">
                    {t("results.yearChip", { value: selectedYear.level })}
                  </Badge>
                ) : null}
                {rawQuery ? (
                  <Badge variant="outline">
                    {t("results.searchChip", { value: rawQuery })}
                  </Badge>
                ) : null}
              </div>
            </div>

            {filteredCourses.length === 0 ? (
              <CortexCard level="flat" className="border-dashed bg-card/75">
                <CortexCardHeader>
                  <CortexCardTitle>{t("empty.title")}</CortexCardTitle>
                  <CortexCardDescription>{t("empty.description")}</CortexCardDescription>
                </CortexCardHeader>
                <CortexCardContent className="flex flex-wrap gap-2">
                  <Link href="/data">
                    <CortexButton size="sm">{t("empty.reset")}</CortexButton>
                  </Link>
                </CortexCardContent>
              </CortexCard>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => {
                  const majorItem = majorsById.get(course.major_id);
                  const yearItem = course.year_level_id
                    ? yearLevelsById.get(course.year_level_id)
                    : null;

                  return (
                    <CortexCard
                      key={course.id}
                      className="flex h-full flex-col border-border/90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <CortexCardHeader className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="outline">
                            {course.code ?? t("courses.noCode")}
                          </Badge>
                          {yearItem ? (
                            <Badge variant="muted">
                              {t("filters.year", { level: yearItem.level })}
                            </Badge>
                          ) : null}
                        </div>
                        <CortexCardTitle className="text-title leading-snug">
                          {course.name_en}
                        </CortexCardTitle>
                        {course.description ? (
                          <CortexCardDescription className="line-clamp-2">
                            {course.description}
                          </CortexCardDescription>
                        ) : (
                          <CortexCardDescription>
                            {t("courses.noDescription")}
                          </CortexCardDescription>
                        )}
                      </CortexCardHeader>
                      <CortexCardContent className="mt-auto flex items-center justify-between pt-1">
                        <p className="truncate pe-3 text-sm text-muted-foreground">
                          {majorItem?.name_en ?? t("courses.unknownMajor")}
                        </p>
                        <Link href={`/data/${course.id}`} className="shrink-0">
                          <CortexButton size="sm">{t("courses.openResources")}</CortexButton>
                        </Link>
                      </CortexCardContent>
                    </CortexCard>
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
