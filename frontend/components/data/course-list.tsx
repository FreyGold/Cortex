import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  CortexCard,
  CortexCardContent,
  CortexCardDescription,
  CortexCardFooter,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";
import type { Course, Major, YearLevel } from "@/lib/data/catalog";

type Props = {
  courses: Course[];
  majorsById: Map<string, Major>;
  yearLevelsById: Map<string, YearLevel>;
};

export function CourseList({ courses, majorsById, yearLevelsById }: Props) {
  if (courses.length === 0) {
    return (
      <CortexCard>
        <CortexCardContent className="pt-6 text-muted-foreground">
          No courses match the current filters.
        </CortexCardContent>
      </CortexCard>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const major = majorsById.get(course.major_id);
        const yearLevel = course.year_level_id
          ? yearLevelsById.get(course.year_level_id)
          : undefined;

        return (
          <CortexCard key={course.id}>
            <CortexCardHeader>
              <CortexCardTitle>{course.name_en}</CortexCardTitle>
              <CortexCardDescription>
                {course.code ?? "No code"} · {major?.name_en ?? "Unknown major"}
              </CortexCardDescription>
            </CortexCardHeader>
            <CortexCardContent>
              <div className="flex flex-wrap gap-2">
                {yearLevel ? (
                  <Badge variant="synapse">Year {yearLevel.level}</Badge>
                ) : null}
                {course.credits ? (
                  <Badge variant="muted">{course.credits} credits</Badge>
                ) : null}
              </div>
            </CortexCardContent>
            <CortexCardFooter>
              <Link
                className="text-sm font-semibold text-primary hover:underline"
                href={`/data/${course.id}`}
              >
                Open resources
              </Link>
            </CortexCardFooter>
          </CortexCard>
        );
      })}
    </div>
  );
}
