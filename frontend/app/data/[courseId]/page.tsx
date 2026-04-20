import {
  ArrowLeft,
  Library,
  ChevronLeft,
  Ghost,
  User,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EditCourseDialog } from "@/components/data/edit-course-dialog";
import { ResourceDialog } from "@/components/data/resource-dialog";
import { ResourceList } from "@/components/data/resource-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCatalogData, getCourseData } from "@/lib/data/catalog";
import { getServerSession } from "@/lib/auth";

type PageProps = {
  params: Promise<{
    courseId: string;
  }>;
  searchParams: Promise<{
    type?: string;
    doctor?: string;
  }>;
};

type FilterUpdates = {
  type?: string | null;
  doctor?: string | null;
};

export default async function CourseResourcesPage({
  params,
  searchParams,
}: PageProps) {
  const { courseId } = await params;
  const { type, doctor } = await searchParams;

  const { course, resources, doctors, doctorAssignments } =
    await getCourseData(courseId);
  const { colleges, majors, yearLevels } = await getCatalogData();

  const session = await getServerSession();
  const isVerifiedOrAdmin = 
    session?.profile?.role === "admin" || session?.profile?.is_verified === true;
  const isAdmin = session?.profile?.role === "admin";

  if (!course) {
    return (
      <AppShell>
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center">
          <Ghost
            className="mb-4 size-12 text-muted-foreground/50"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            Course not found
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The course you are looking for does not exist or has been moved.
          </p>
          <Button variant="outline" asChild className="mt-6 gap-2">
            <Link href="/data">
              <ArrowLeft className="size-4" />
              Return to Data Browser
            </Link>
          </Button>
        </main>
      </AppShell>
    );
  }

  const assignedDoctorIds = new Set(
    doctorAssignments.map((item) => item.doctor_id),
  );
  const courseDoctors = doctors.filter((item) =>
    assignedDoctorIds.has(item.id),
  );
  const doctorsById = new Map(doctors.map((item) => [item.id, item]));

  const filteredResources = resources.filter((resource) => {
    const typeMatch = !type || resource.type === type;
    const doctorMatch = !doctor || resource.doctor_id === doctor;
    return typeMatch && doctorMatch;
  });

  const buildHref = (updates: FilterUpdates = {}) => {
    const nextType = updates.type === undefined ? (type ?? null) : updates.type;
    const nextDoctor =
      updates.doctor === undefined ? (doctor ?? null) : updates.doctor;

    const nextParams = new URLSearchParams();
    if (nextType) nextParams.set("type", nextType);
    if (nextDoctor) nextParams.set("doctor", nextDoctor);

    const query = nextParams.toString();
    return query ? `/data/${courseId}?${query}` : `/data/${courseId}`;
  };

  return (
    <AppShell>
      <main className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-10">
          <header className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 h-8 gap-1.5 text-muted-foreground"
            >
              <Link href="/data">
                <ChevronLeft className="size-4" />
                Back to Data
              </Link>
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-medium">
                    {course.code ?? "Course"}
                  </Badge>
                  <Badge variant="outline" className="font-medium">
                    <Library className="mr-1 size-3.5" />
                    {resources.length} resources
                  </Badge>
                  <Badge variant="outline" className="font-medium">
                    <User className="mr-1 size-3.5" />
                    {courseDoctors.length} instructors
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {course.name_en}
                </h1>
                {course.description ? (
                  <p className="text-sm leading-6 text-muted-foreground md:text-base">
                    {course.description}
                  </p>
                ) : null}
              </div>

              {isAdmin ? (
                <EditCourseDialog
                  course={course}
                  colleges={colleges}
                  majors={majors}
                  yearLevels={yearLevels}
                />
              ) : null}
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <section className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Available Resources
                  </h2>
                  <Badge variant="outline">{filteredResources.length}</Badge>
                </div>
                <ResourceList
                  resources={filteredResources}
                  doctorsById={doctorsById}
                  selectedType={type ?? null}
                  selectedDoctorId={doctor ?? null}
                  isAdmin={isAdmin}
                  doctors={doctors}
                />
              </section>
            </section>

            <aside className="self-start lg:sticky lg:top-24">
              <Card className="border-border/60 shadow-none">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">Filters</CardTitle>
                  <CardDescription>
                    Narrow resources by type and instructor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Resource type
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={!type ? "default" : "outline"}
                        asChild
                        className="h-8"
                      >
                        <Link href={buildHref({ type: null })}>All types</Link>
                      </Button>
                      {(
                        ["lecture", "exam", "assignment", "other"] as const
                      ).map((resourceType) => (
                        <Button
                          key={resourceType}
                          size="sm"
                          variant={
                            type === resourceType ? "default" : "outline"
                          }
                          asChild
                          className="h-8 capitalize"
                        >
                          <Link href={buildHref({ type: resourceType })}>
                            {resourceType}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Instructor
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={!doctor ? "default" : "outline"}
                        asChild
                        className="h-8"
                      >
                        <Link href={buildHref({ doctor: null })}>
                          All instructors
                        </Link>
                      </Button>
                      {courseDoctors.map((courseDoctor) => (
                        <Button
                          key={courseDoctor.id}
                          size="sm"
                          variant={
                            doctor === courseDoctor.id ? "default" : "outline"
                          }
                          asChild
                          className="h-8"
                        >
                          <Link href={buildHref({ doctor: courseDoctor.id })}>
                            {courseDoctor.name_en}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {isVerifiedOrAdmin ? (
                    <ResourceDialog courseId={courseId} doctors={doctors} />
                  ) : null}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
