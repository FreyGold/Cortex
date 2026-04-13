import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  CortexCard,
  CortexCardContent,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";
import type { Major } from "@/lib/data/catalog";

type Props = {
  majors: Major[];
  selectedMajorId: string | null;
  selectedYearId: string | null;
};

export function MajorSelector({
  majors,
  selectedMajorId,
  selectedYearId,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {majors.map((major) => {
        const isSelected = major.id === selectedMajorId;
        const url = new URLSearchParams();
        url.set("major", major.id);
        if (selectedYearId) url.set("year", selectedYearId);

        return (
          <Link key={major.id} href={`/data?${url.toString()}`}>
            <CortexCard
              level={isSelected ? "brand" : "card"}
              className="h-full transition-transform hover:-translate-y-0.5"
            >
              <CortexCardHeader>
                <CortexCardTitle>{major.name_en}</CortexCardTitle>
              </CortexCardHeader>
              <CortexCardContent className="flex items-center justify-between">
                <Badge variant={isSelected ? "brand" : "muted"}>
                  {major.slug}
                </Badge>
                {major.color ? (
                  <span
                    className="size-3 rounded-full border border-border"
                    style={{ backgroundColor: major.color }}
                    aria-hidden="true"
                  />
                ) : null}
              </CortexCardContent>
            </CortexCard>
          </Link>
        );
      })}
    </div>
  );
}
