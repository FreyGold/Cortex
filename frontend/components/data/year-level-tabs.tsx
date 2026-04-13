import Link from "next/link";
import { CortexButton } from "@/components/ui/cortex-button";
import type { YearLevel } from "@/lib/data/catalog";

type Props = {
  yearLevels: YearLevel[];
  selectedYearId: string | null;
  selectedMajorId: string | null;
};

export function YearLevelTabs({
  yearLevels,
  selectedYearId,
  selectedMajorId,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {yearLevels.map((yearLevel) => {
        const url = new URLSearchParams();
        if (selectedMajorId) url.set("major", selectedMajorId);
        url.set("year", yearLevel.id);

        const isSelected = yearLevel.id === selectedYearId;

        return (
          <Link key={yearLevel.id} href={`/data?${url.toString()}`}>
            <CortexButton
              variant={isSelected ? "primary" : "outline"}
              size="sm"
            >
              Year {yearLevel.level}
            </CortexButton>
          </Link>
        );
      })}
    </div>
  );
}
