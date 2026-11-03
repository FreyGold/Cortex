import { CalendarHeaderSkeleton } from "@/components/daily/full-calendar/skeletons/calendar-header-skeleton";
import { MonthViewSkeleton } from "@/components/daily/full-calendar/skeletons/month-view-skeleton";

export function CalendarSkeleton() {
  return (
    <div className="container mx-auto">
      <div className="flex h-screen flex-col">
        <CalendarHeaderSkeleton />
        <div className="flex-1">
          <MonthViewSkeleton />
        </div>
      </div>
    </div>
  );
}
