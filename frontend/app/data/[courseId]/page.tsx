import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ResourceList } from "@/components/data/resource-list";
import { Badge } from "@/components/ui/badge";
import { CortexButton } from "@/components/ui/cortex-button";
import { getCourseData } from "@/lib/data/catalog";

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
  if (!course) {
    return (
      <AppShell>
        <main className="container mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold">Course not found</h1>
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
      <main className="container mx-auto space-y-8 px-4 py-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <Badge variant="synapse">{course.code ?? "Course"}</Badge>
          <Link href="/data">
            <CortexButton variant="outline" size="sm">
              Back to data browser
            </CortexButton>
          </Link>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{course.name_en}</h1>
        {course.description ? (
          <p className="text-muted-foreground">{course.description}</p>
        ) : null}
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Filters</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/data/${courseId}`}>
            <CortexButton variant={!type ? "primary" : "outline"} size="sm">
              All types
            </CortexButton>
          </Link>
          {(["lecture", "exam", "assignment", "other"] as const).map(
            (resourceType) => {
              const params = new URLSearchParams();
              params.set("type", resourceType);
              if (doctor) params.set("doctor", doctor);

              return (
                <Link
                  key={resourceType}
                  href={`/data/${courseId}?${params.toString()}`}
                >
                  <CortexButton
                    variant={type === resourceType ? "primary" : "outline"}
                    size="sm"
                  >
                    {resourceType}
                  </CortexButton>
                </Link>
              );
            },
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/data/${courseId}${type ? `?type=${type}` : ""}`}>
            <CortexButton variant={!doctor ? "primary" : "outline"} size="sm">
              All doctors
            </CortexButton>
          </Link>
          {courseDoctors.map((courseDoctor) => {
            const params = new URLSearchParams();
            if (type) params.set("type", type);
            params.set("doctor", courseDoctor.id);

            return (
              <Link
                key={courseDoctor.id}
                href={`/data/${courseId}?${params.toString()}`}
              >
                <CortexButton
                  variant={doctor === courseDoctor.id ? "primary" : "outline"}
                  size="sm"
                >
                  {courseDoctor.name_en}
                </CortexButton>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Resources</h2>
        <ResourceList
          resources={resources}
          doctorsById={doctorsById}
          selectedType={type ?? null}
          selectedDoctorId={doctor ?? null}
        />
      </section>

      {previewDriveId ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Google Drive Preview</h2>

          <div className="flex flex-wrap gap-2">
            {filteredResources.map((resource) => {
              const params = new URLSearchParams();
              if (type) params.set("type", type);
              if (doctor) params.set("doctor", doctor);
              params.set("preview", resource.google_drive_id);

              return (
                <Link
                  key={resource.id}
                  href={`/data/${courseId}?${params.toString()}`}
                >
                  <CortexButton
                    variant={
                      previewDriveId === resource.google_drive_id
                        ? "primary"
                        : "outline"
                    }
                    size="sm"
                  >
                    {resource.title_en}
                  </CortexButton>
                </Link>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <iframe
              src={`https://drive.google.com/file/d/${previewDriveId}/preview`}
              title="Google Drive resource preview"
              className="h-[600px] w-full"
              allow="autoplay"
            />
          </div>
        </section>
      ) : null}
      </main>
    </AppShell>
  );
}
