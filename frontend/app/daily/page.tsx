"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Target } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { CalendarBody } from "@/components/daily/full-calendar/calendar-body";
import {
  CalendarProvider,
  useCalendar,
} from "@/components/daily/full-calendar/contexts/calendar-context";
import { DndProvider } from "@/components/daily/full-calendar/contexts/dnd-context";
import { CalendarHeader } from "@/components/daily/full-calendar/header/calendar-header";
import { HabitsModal } from "@/components/daily/habits-modal";
import { AssistantModal } from "@/components/daily/views/assistant-modal";
import { InsightsModal } from "@/components/daily/views/insights-modal";
import { SearchModal } from "@/components/daily/views/search-modal";
import { PomodoroView } from "@/components/daily/views/pomodoro-view";
import { useDailyLogs } from "@/hooks/use-daily";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DailyCalendarContentProps {
  onHabitsOpen: () => void;
  onInsightsOpen: () => void;
  onSearchOpen: () => void;
  onAssistantOpen: () => void;
}

function DailyCalendarContent({
  onHabitsOpen,
  onInsightsOpen,
  onSearchOpen,
  onAssistantOpen,
}: DailyCalendarContentProps) {
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
      <CalendarHeader
        onHabitsOpen={onHabitsOpen}
        onInsightsOpen={onInsightsOpen}
        onSearchOpen={onSearchOpen}
        onAssistantOpen={onAssistantOpen}
      />
      <div className="flex-1 overflow-auto custom-scrollbar">
        <CalendarBody />
      </div>
    </div>
  );
}

export default function DailyCalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "calendar";

  const [habitsOpen, setHabitsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 pt-3 overflow-hidden bg-background/50 gap-3">
          
          {/* Top-Level Navigation */}
          <div className="flex items-center justify-between shrink-0">
            <h1 className="text-xl font-bold tracking-tight">Daily</h1>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="h-10 bg-muted/40 p-1 rounded-full border border-border/5 shadow-inner">
                <TabsTrigger 
                  value="calendar" 
                  className="px-4 rounded-full gap-2 text-[12px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <CalendarIcon className="size-3.5" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger 
                  value="pomodoro" 
                  className="px-4 rounded-full gap-2 text-[12px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all duration-300"
                >
                  <Target className="size-3.5" />
                  Pomodoro
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main Content Area */}
          {activeTab === "calendar" ? (
            <CalendarProvider events={[]} users={[]} view="month">
              <DndProvider>
                <DailyCalendarContent
                  onHabitsOpen={() => setHabitsOpen(true)}
                  onInsightsOpen={() => setInsightsOpen(true)}
                  onSearchOpen={() => setSearchOpen(true)}
                  onAssistantOpen={() => setAssistantOpen(true)}
                />
              </DndProvider>
            </CalendarProvider>
          ) : (
            <PomodoroView />
          )}

        </div>
      </div>
      <HabitsModal isOpen={habitsOpen} onOpenChange={setHabitsOpen} />
      <InsightsModal isOpen={insightsOpen} onOpenChange={setInsightsOpen} />
      <SearchModal isOpen={searchOpen} onOpenChange={setSearchOpen} />
      <AssistantModal isOpen={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}
