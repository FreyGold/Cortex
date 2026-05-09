"use client";

import React from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useDailyLogs } from "@/hooks/use-daily";
import { useSearchParams } from "next/navigation";
import {
  CalendarProvider,
  useCalendar,
} from "@/components/daily/full-calendar/contexts/calendar-context";
import { DndProvider } from "@/components/daily/full-calendar/contexts/dnd-context";
import { CalendarHeader } from "@/components/daily/full-calendar/header/calendar-header";
import { CalendarBody } from "@/components/daily/full-calendar/calendar-body";
import { Loader2 } from "lucide-react";

function DailyCalendarContent() {
  const { selectedDate } = useCalendar();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || undefined;

  const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");

  const { isLoading } = useDailyLogs(monthStart, monthEnd, workspaceId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col border rounded-2xl bg-card shadow-sm overflow-hidden ring-1 ring-border/5">
      <CalendarHeader />
      <div className="flex-1 overflow-auto custom-scrollbar">
        <CalendarBody />
      </div>
    </div>
  );
}

export default function DailyCalendarPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col p-8 pt-6 overflow-hidden bg-background/50">
          <CalendarProvider events={[]} users={[]} view="month">
            <DndProvider>
              <DailyCalendarContent />
            </DndProvider>
          </CalendarProvider>
        </div>
      </div>
    </div>
  );
}
