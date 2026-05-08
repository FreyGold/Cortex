"use client";

import React, { useState } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useDailyLogs } from "@/hooks/use-daily";
import { useSearchParams } from "next/navigation";
import { CalendarProvider, useCalendar } from "@/components/daily/full-calendar/contexts/calendar-context";
import { DndProvider } from "@/components/daily/full-calendar/contexts/dnd-context";
import { CalendarHeader } from "@/components/daily/full-calendar/header/calendar-header";
import { CalendarBody } from "@/components/daily/full-calendar/calendar-body";
import {
  Loader2,
  CalendarDays,
  TrendingUp,
  Target,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DailyStats } from "@/components/daily/views/daily-stats";
import { DailyHabits } from "@/components/daily/views/daily-habits";
import { DailySearch } from "@/components/daily/views/daily-search";
import { DailyAssistant } from "@/components/daily/views/daily-assistant";

const tabs = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "stats", label: "Progress", icon: TrendingUp },
  { id: "habits", label: "Habits", icon: Target },
  { id: "search", label: "Search", icon: Search },
] as const;

function DailyCalendarContent() {
  const { selectedDate } = useCalendar();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || undefined;

  const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");

  const { data, isLoading } = useDailyLogs(monthStart, monthEnd, workspaceId);

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
  const [activeTab, setActiveTab] = useState<string>("calendar");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "calendar":
        return (
          <CalendarProvider events={[]} users={[]} view="month">
            <DndProvider>
              <DailyCalendarContent />
            </DndProvider>
          </CalendarProvider>
        );
      case "stats":
        return <DailyStats />;
      case "habits":
        return <DailyHabits />;
      case "search":
        return <DailySearch />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {/* Tab bar */}
      <div className="shrink-0 flex items-center gap-1 px-8 pt-6 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all select-none",
              activeTab === tab.id
                ? "bg-accent text-foreground shadow-sm"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-accent/40"
            )}
          >
            <tab.icon className={cn("size-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground/30")} />
            {tab.label}
          </button>
        ))}

        {/* Assistant toggle */}
        <button
          onClick={() => setIsAssistantOpen(!isAssistantOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all select-none ml-auto",
            isAssistantOpen
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground/50 hover:text-foreground hover:bg-accent/40"
          )}
        >
          <Sparkles className={cn("size-4", isAssistantOpen ? "text-primary" : "text-muted-foreground/30")} />
          Assistant
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col p-8 pt-4 overflow-hidden bg-background/50">
          {renderContent()}
        </div>

        {/* Assistant slide-over */}
        <div className={cn(
          "h-full border-l border-border/5 bg-background transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          isAssistantOpen ? "w-[400px]" : "w-0 overflow-hidden border-none"
        )}>
          {isAssistantOpen && (
            <DailyAssistant onClose={() => setIsAssistantOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
