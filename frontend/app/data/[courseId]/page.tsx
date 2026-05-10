import { ArrowLeft, ChevronLeft, Ghost, Library, User } from "lucide-react";
import Link from "next/link";
import { EditCourseDialog } from "@/components/data/edit-course-dialog";
import { ManageCourseDoctorsDialog } from "@/components/data/manage-course-doctors-dialog";
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
import { getServerSession } from "@/lib/auth";
import { getCatalogData, getCourseData } from "@/lib/data/catalog";

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
    session?.profile?.role === "admin" ||
    session?.profile?.is_verified === true;
  const isAdmin = session?.profile?.role === "admin";

  if (!course) {
    return (
      <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 text-center flex-1">
        <Ghost className="mb-4 size-12 text-muted-foreground/50" />
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
    if (nextType && nextType !== "all") nextParams.set("type", nextType);
    if (nextDoctor && nextDoctor !== "all")
      nextParams.set("doctor", nextDoctor);

    const query = nextParams.toString();
    return query ? `/data/${courseId}?${query}` : `/data/${courseId}`;
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-[1200px] mx-auto space-y-8 px-6 py-8 md:py-12">
        <header className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 h-8 gap-1.5 text-muted-foreground hover:bg-accent/40 rounded-lg transition-all"
            >
              <Link href="/data">
                <ChevronLeft className="size-4" />
                Back to Explorer
              </Link>
            </Button>

            {isAdmin && (
              <ManageCourseDoctorsDialog
                courseId={courseId}
                allDoctors={doctors}
                assignedDoctors={courseDoctors}
              />
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="font-bold text-[10px] h-5 px-2 bg-primary/10 text-primary border-none uppercase tracking-wider"
                >
                  {course.code ?? "Course"}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-semibold text-[10px] h-5 px-2 border-border/60 text-muted-foreground/60 uppercase tracking-wider"
                >
                  <Library className="mr-1 size-3" />
                  {resources.length} resources
                </Badge>
                <Badge
                  variant="outline"
                  className="font-semibold text-[10px] h-5 px-2 border-border/60 text-muted-foreground/60 uppercase tracking-wider"
                >
                  <User className="mr-1 size-3" />
                  {courseDoctors.length} instructors
                </Badge>
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl leading-[1.1] bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
                {course.name_en}
              </h1>
              {course.description ? (
                <p className="text-sm md:text-lg leading-relaxed text-muted-foreground/80 max-w-2xl">
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

        <div className="grid gap-10 lg:grid-cols-[1fr_300px] items-start pb-20">
          <section className="space-y-8">
            <div className="flex items-center justify-between gap-3 border-b border-border/5 pb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                Available Resources
              </h2>
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-bold bg-muted/30 text-muted-foreground/60"
              >
                {filteredResources.length}
              </Badge>
            </div>
            <ResourceList
              resources={filteredResources}
              doctorsById={doctorsById}
              isAdmin={isAdmin}
              doctors={doctors}
              selectedType={(type as string) || null}
              selectedDoctorId={(doctor as string) || null}
            />{" "}
          </section>

          <aside className="self-start lg:sticky lg:top-4">
            <div className="rounded-3xl border border-border/40 bg-card/30 p-1">
              <div className="px-4 py-3 border-b border-border/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  Refine Materials
                </span>
              </div>
              <div className="p-4 space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/40 px-1">
                    Resource Type
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant={!type ? "secondary" : "ghost"}
                      asChild
                      className="h-8 text-[11px] px-3 font-bold uppercase tracking-wider rounded-full transition-all"
                    >
                      <Link href={buildHref({ type: null })}>All</Link>
                    </Button>
                    {(["lecture", "exam", "assignment", "other"] as const).map(
                      (resourceType) => (
                        <Button
                          key={resourceType}
                          size="sm"
                          variant={
                            type === resourceType ? "secondary" : "ghost"
                          }
                          asChild
                          className="h-8 text-[11px] px-3 font-bold uppercase tracking-wider rounded-full transition-all capitalize"
                        >
                          <Link href={buildHref({ type: resourceType })}>
                            {resourceType}
                          </Link>
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/40 px-1">
                    Instructor
                  </p>
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant={!doctor ? "secondary" : "ghost"}
                      asChild
                      className="h-8 text-[11px] px-3 font-bold uppercase tracking-wider rounded-xl justify-start transition-all"
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
                          doctor === courseDoctor.id ? "secondary" : "ghost"
                        }
                        asChild
                        className="h-8 text-[11px] px-3 font-bold uppercase tracking-wider rounded-xl justify-start transition-all"
                      >
                        <Link href={buildHref({ doctor: courseDoctor.id })}>
                          {courseDoctor.name_en}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>

                {isVerifiedOrAdmin && (
                  <div className="pt-4 border-t border-border/5">
                    <ResourceDialog
                      courseId={courseId}
                      doctors={doctors}
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
