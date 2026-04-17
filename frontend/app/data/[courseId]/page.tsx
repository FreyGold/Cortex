import {
  ArrowLeft,
  Books,
  CaretLeft,
  FolderOpen,
  Folders,
  Ghost,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ResourceList } from "@/components/data/resource-list";
import { ResourceDialog } from "@/components/data/resource-dialog";
import { EditCourseDialog } from "@/components/data/edit-course-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourseData, getCatalogData } from "@/lib/data/catalog";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    courseId: string;
  }>;
  searchParams: Promise<{
    type?: string;
    doctor?: string;
    preview?: string;
  }>;
};

export default async function CourseResourcesPage({
  params,
  searchParams,
}: PageProps) {
  const { courseId } = await params;
  const { type, doctor, preview } = await searchParams;

  const { course, resources, doctors, doctorAssignments } =
    await getCourseData(courseId);
  const { colleges, majors, yearLevels } = await getCatalogData();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isVerifiedOrAdmin = false;
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_verified")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && (profile.role === "admin" || profile.is_verified)) {
      isVerifiedOrAdmin = true;
    }
    if (profile && profile.role === "admin") {
      isAdmin = true;
    }
  }

  if (!course) {
    return (
      <AppShell>
        <main className="container mx-auto px-4 py-20 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="bg-muted/30 p-6 rounded-full mb-6">
            <Ghost
              className="size-16 text-muted-foreground/50 animate-bounce"
              weight="duotone"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Course not found
          </h1>
          <p className="text-muted-foreground mt-2 mb-8 max-w-md text-balance">
            The course you're looking for doesn't exist or has been moved.
          </p>
          <Button
            variant="default"
            asChild
            className="gap-2 h-10 px-6 rounded-full shadow-md active:scale-95 transition-all"
          >
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
  const previewDriveId =
    preview ?? filteredResources[0]?.google_drive_id ?? null;

  return (
    <AppShell>
      <main className="relative overflow-hidden min-h-[calc(100vh-4rem)]">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl opacity-50" />

        <div className="container mx-auto max-w-5xl space-y-10 px-4 py-8 md:py-12">
          <header className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out-quart">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="-ml-3 h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
              >
                <Link href="/data">
                  <CaretLeft className="size-4" />
                  <span className="font-medium text-xs tracking-wide">
                    Back to Data
                  </span>
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 animate-in zoom-in-95 duration-500 delay-100 fill-mode-both">
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-bold uppercase tracking-widest text-[10px] border-primary/20 bg-primary/5 text-primary shadow-sm"
                >
                  {course.code ?? "Course"}
                </Badge>
                <div className="h-4 w-px bg-border/60 mx-1"></div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Books className="size-3.5" />
                  {resources.length} Resources
                </span>
              </div>

              <div className="flex items-start gap-4">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent animate-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
                  {course.name_en}
                </h1>
                {isAdmin && (
                  <div className="mt-2 animate-in fade-in">
                    <EditCourseDialog course={course} colleges={colleges} majors={majors} yearLevels={yearLevels} />
                  </div>
                )}
              </div>

              {course.description ? (
                <p className="max-w-3xl text-base md:text-lg leading-relaxed text-muted-foreground animate-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
                  {course.description}
                </p>
              ) : null}
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px] animate-in fade-in duration-1000 delay-300 fill-mode-both">
            <div className="space-y-8 lg:order-2">
              <section className="space-y-6 bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm sticky top-24 transition-all duration-300 hover:shadow-md hover:border-primary/20">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Folders className="size-4 text-primary" weight="duotone" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">
                    Filters
                  </h2>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Resource Type
                    <span className="h-px flex-1 bg-border/50"></span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/data/${courseId}${doctor ? `?doctor=${doctor}` : ""}`}
                    >
                      <Button
                        variant={!type ? "default" : "outline"}
                        size="sm"
                        className={`h-7 text-xs px-3 rounded-full transition-all duration-300 active:scale-95 ${!type ? "shadow-md shadow-primary/20 font-semibold" : "hover:bg-primary/5 hover:border-primary/30 border-border/60 text-muted-foreground hover:text-foreground"}`}
                      >
                        All Types
                      </Button>
                    </Link>
                    {(["lecture", "exam", "assignment", "other"] as const).map(
                      (resourceType) => {
                        const params = new URLSearchParams();
                        params.set("type", resourceType);
                        if (doctor) params.set("doctor", doctor);

                        const isSelected = type === resourceType;

                        return (
                          <Link
                            key={resourceType}
                            href={`/data/${courseId}?${params.toString()}`}
                          >
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={`h-7 text-xs px-3 capitalize rounded-full transition-all duration-300 active:scale-95 ${isSelected ? "shadow-md shadow-primary/20 font-semibold" : "hover:bg-primary/5 hover:border-primary/30 border-border/60 text-muted-foreground hover:text-foreground"}`}
                            >
                              {resourceType}
                            </Button>
                          </Link>
                        );
                      },
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Instructor
                    <span className="h-px flex-1 bg-border/50"></span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/data/${courseId}${type ? `?type=${type}` : ""}`}
                    >
                      <Button
                        variant={!doctor ? "default" : "outline"}
                        size="sm"
                        className={`h-7 text-xs px-3 rounded-full transition-all duration-300 active:scale-95 ${!doctor ? "shadow-md shadow-primary/20 font-semibold" : "hover:bg-primary/5 hover:border-primary/30 border-border/60 text-muted-foreground hover:text-foreground"}`}
                      >
                        All Instructors
                      </Button>
                    </Link>
                    {courseDoctors.map((courseDoctor) => {
                      const params = new URLSearchParams();
                      if (type) params.set("type", type);
                      params.set("doctor", courseDoctor.id);

                      const isSelected = doctor === courseDoctor.id;

                      return (
                        <Link
                          key={courseDoctor.id}
                          href={`/data/${courseId}?${params.toString()}`}
                        >
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`h-7 text-xs px-3 rounded-full transition-all duration-300 active:scale-95 ${isSelected ? "shadow-md shadow-primary/20 font-semibold" : "hover:bg-primary/5 hover:border-primary/30 border-border/60 text-muted-foreground hover:text-foreground"}`}
                          >
                            {courseDoctor.name_en}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {isVerifiedOrAdmin && (
                  <ResourceDialog courseId={courseId} doctors={doctors} />
                )}
              </section>
            </div>

            <div className="space-y-8 lg:order-1">
              {previewDriveId && filteredResources.length > 0 ? (
                <section className="space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-3">
                    <div className="space-y-1">
                      <h2 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
                        <FolderOpen
                          className="size-5 text-primary"
                          weight="duotone"
                        />
                        Preview
                      </h2>
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/80">
                        {filteredResources.find(
                          (r) => r.google_drive_id === previewDriveId,
                        )?.title_en ?? "Document"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {filteredResources.map((resource) => {
                      const params = new URLSearchParams();
                      if (type) params.set("type", type);
                      if (doctor) params.set("doctor", doctor);
                      params.set("preview", resource.google_drive_id);

                      const isSelected =
                        previewDriveId === resource.google_drive_id;

                      return (
                        <Link
                          key={resource.id}
                          href={`/data/${courseId}?${params.toString()}`}
                          scroll={false}
                        >
                          <Button
                            variant={isSelected ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-8 px-3 text-xs font-medium rounded-md transition-all duration-300 ${isSelected ? "shadow-sm border border-border/50 bg-secondary/80" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                          >
                            {resource.title_en}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm group hover:shadow-md transition-all duration-500 hover:border-primary/20 relative">
                    <div className="absolute inset-0 bg-muted/20 animate-pulse -z-10 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Ghost
                          className="size-4 animate-bounce"
                          weight="duotone"
                        />
                        Loading preview...
                      </p>
                    </div>
                    <iframe
                      src={`https://drive.google.com/file/d/${previewDriveId}/preview`}
                      title="Google Drive resource preview"
                      className="min-h-[500px] md:h-[700px] w-full bg-background relative z-10 opacity-0 animate-in fade-in duration-1000 fill-mode-forwards"
                      style={{ animationDelay: "500ms" }}
                      allow="autoplay"
                    />
                  </div>
                </section>
              ) : null}

              <section className="space-y-5">
                {!previewDriveId && (
                  <div className="flex items-center gap-2 border-b border-border/50 pb-3">
                    <h2 className="text-lg font-bold tracking-tight">
                      Available Resources
                    </h2>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0.5 text-[10px]"
                    >
                      {filteredResources.length}
                    </Badge>
                  </div>
                )}

                <ResourceList
                  resources={filteredResources}
                  doctorsById={doctorsById}
                  selectedType={type ?? null}
                  selectedDoctorId={doctor ?? null}
                  isAdmin={isAdmin}
                  doctors={doctors}
                />
              </section>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
