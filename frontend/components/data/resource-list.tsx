import { Badge } from "@/components/ui/badge";
import {
  CortexCard,
  CortexCardContent,
  CortexCardDescription,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";
import type { Doctor, Resource } from "@/lib/data/catalog";

type Props = {
  resources: Resource[];
  doctorsById: Map<string, Doctor>;
  selectedType: string | null;
  selectedDoctorId: string | null;
};

export function ResourceList({
  resources,
  doctorsById,
  selectedType,
  selectedDoctorId,
}: Props) {
  const filtered = resources.filter((resource) => {
    const typeMatch = !selectedType || resource.type === selectedType;
    const doctorMatch =
      !selectedDoctorId || resource.doctor_id === selectedDoctorId;
    return typeMatch && doctorMatch;
  });

  if (filtered.length === 0) {
    return (
      <CortexCard>
        <CortexCardContent className="pt-6 text-muted-foreground">
          No resources found for the current filters.
        </CortexCardContent>
      </CortexCard>
    );
  }

  return (
    <div className="space-y-4">
      {filtered.map((resource) => {
        const doctor = resource.doctor_id
          ? doctorsById.get(resource.doctor_id)
          : undefined;
        const driveUrl =
          resource.google_drive_url ??
          `https://drive.google.com/file/d/${resource.google_drive_id}/view`;

        return (
          <CortexCard key={resource.id}>
            <CortexCardHeader>
              <CortexCardTitle>{resource.title_en}</CortexCardTitle>
              <CortexCardDescription>
                {doctor?.name_en ?? "Unassigned doctor"}
              </CortexCardDescription>
            </CortexCardHeader>
            <CortexCardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="axon">{resource.type}</Badge>
                {resource.exam_type ? (
                  <Badge variant="outline">{resource.exam_type}</Badge>
                ) : null}
                {resource.file_type ? (
                  <Badge variant="muted">{resource.file_type}</Badge>
                ) : null}
              </div>

              <div className="text-sm text-muted-foreground">
                Views: {resource.view_count ?? 0} · Downloads:{" "}
                {resource.download_count ?? 0}
              </div>

              <div className="flex flex-wrap gap-4 text-sm font-semibold">
                <a
                  className="text-primary hover:underline"
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download / Open
                </a>
                <a
                  className="text-primary hover:underline"
                  href={`https://drive.google.com/file/d/${resource.google_drive_id}/preview`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Preview
                </a>
              </div>
            </CortexCardContent>
          </CortexCard>
        );
      })}
    </div>
  );
}
