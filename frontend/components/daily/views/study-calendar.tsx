"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useUserYearlyLog, useUserMonthlyLog } from "@/hooks/use-daily";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StudyCalendarProps {
  userId: string;
  userName: string;
}

export function StudyCalendar({ userId, userName }: StudyCalendarProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [view, setView] = useState<"yearly" | "monthly">("yearly");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const { data: yearlyData } = useUserYearlyLog(userId, currentYear);
  const { data: monthlyData } = useUserMonthlyLog(userId, currentYear, selectedMonth);

  const yearlyLog = ((yearlyData as any)?.log || []) as { date: string; total_seconds: number }[];
  const monthlyLog = ((monthlyData as any)?.log || []) as { date: string; total_seconds: number }[];

  const yearlyLogMap = useMemo(() => new Map(yearlyLog.map((e) => [e.date, e])), [yearlyLog]);

  const weeks = useMemo(() => {
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    const days: { date: Date; entry: { total_seconds: number } | undefined }[] = [];
    for (let d = new Date(yearStart); d <= yearEnd; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      days.push({ date: new Date(d), entry: yearlyLogMap.get(key) });
    }
    const w: { date: Date; entry: { total_seconds: number } | undefined }[][] = [];
    let cur: { date: Date; entry: { total_seconds: number } | undefined }[] = [];
    for (let i = 0; i < yearStart.getDay(); i++) cur.push({ date: new Date(0), entry: undefined });
    for (const day of days) {
      cur.push(day);
      if (cur.length === 7) { w.push(cur); cur = []; }
    }
    while (cur.length < 7) cur.push({ date: new Date(0), entry: undefined });
    if (cur.length) w.push(cur);
    return w;
  }, [currentYear, yearlyLogMap]);

  const getIntensity = (total_seconds: number) => {
    if (!total_seconds) return "bg-muted/10";
    const hours = total_seconds / 3600;
    if (hours < 0.5) return "bg-emerald-500/15";
    if (hours < 2) return "bg-emerald-500/30";
    if (hours < 4) return "bg-emerald-500/50";
    return "bg-emerald-500/70";
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyLogMap = useMemo(() => new Map(monthlyLog.map((e) => [e.date, e])), [monthlyLog]);

  const monthDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, selectedMonth, 0).getDate();
    const d: { date: Date; entry: { total_seconds: number } | undefined }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dt = new Date(currentYear, selectedMonth - 1, i);
      const key = dt.toISOString().split("T")[0];
      d.push({ date: dt, entry: monthlyLogMap.get(key) });
    }
    return d;
  }, [currentYear, selectedMonth, monthlyLogMap]);

  const firstDayOfMonth = new Date(currentYear, selectedMonth - 1, 1).getDay();

  const cellSize = "size-[16px]";

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 p-0.5 rounded-lg bg-muted/30">
          <button onClick={() => setView("yearly")} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", view === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            Year
          </button>
          <button onClick={() => setView("monthly")} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", view === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            Month
          </button>
        </div>
        {view === "monthly" && (
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedMonth((p) => (p === 1 ? 12 : p - 1))} className="size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center text-xs">◀</button>
            <span className="text-xs font-bold w-20 text-center">{monthNames[selectedMonth - 1]} {currentYear}</span>
            <button onClick={() => setSelectedMonth((p) => (p === 12 ? 1 : p + 1))} className="size-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center text-xs">▶</button>
          </div>
        )}
      </div>

      {view === "yearly" ? (
        <div className="flex gap-0.5 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex flex-col gap-0.5 mr-2 shrink-0">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((l, i) => (
              <div key={i} className="h-[16px] text-[10px] font-bold text-muted-foreground/40 flex items-center leading-none">{l}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => {
                const tooltipContent = day.entry
                  ? `${day.date.toISOString().split("T")[0]}: ${Math.floor(day.entry.total_seconds / 3600)}h ${Math.floor((day.entry.total_seconds % 3600) / 60)}m`
                  : day.date.getTime() ? day.date.toISOString().split("T")[0] : "";
                return (
                  <Tooltip key={di}>
                    <TooltipTrigger asChild>
                      <div className={cn(cellSize, "rounded-[2px] transition-colors cursor-default", day.entry ? getIntensity(day.entry.total_seconds) : "bg-muted/10")} />
                    </TooltipTrigger>
                    {tooltipContent && (
                      <TooltipContent side="top" className="text-sm font-medium bg-foreground/90 text-background px-3 py-2">
                        {tooltipContent}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-xs font-bold text-muted-foreground/40 text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`p${i}`} />
            ))}
            {monthDays.map((day) => {
              const hrs = day.entry ? Math.floor(day.entry.total_seconds / 3600) : 0;
              const mins = day.entry ? Math.floor((day.entry.total_seconds % 3600) / 60) : 0;
              const hasStudy = !!day.entry && (hrs > 0 || mins > 0);
              return (
                <Tooltip key={day.date.toISOString()}>
                  <TooltipTrigger asChild>
                    <div className={cn("aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors cursor-default", hasStudy && day.entry ? getIntensity(day.entry.total_seconds) : "bg-muted/20 text-muted-foreground/40")}>
                      <span className={cn("font-bold", hasStudy ? "text-foreground" : "")}>{day.date.getDate()}</span>
                      {hasStudy && <span className="text-[10px] font-bold text-muted-foreground/60">{hrs > 0 ? `${hrs}h` : `${mins}m`}</span>}
                    </div>
                  </TooltipTrigger>
                  {hasStudy && (
                    <TooltipContent side="top" className="text-sm font-medium bg-foreground/90 text-background px-3 py-2">
                      {hrs}h {mins}m
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-1">
        <span className="text-[9px] font-bold text-muted-foreground/40">Less</span>
        <div className={cn(cellSize, "rounded-[2px] bg-muted/10")} />
        <div className={cn(cellSize, "rounded-[2px] bg-emerald-500/15")} />
        <div className={cn(cellSize, "rounded-[2px] bg-emerald-500/30")} />
        <div className={cn(cellSize, "rounded-[2px] bg-emerald-500/50")} />
        <div className={cn(cellSize, "rounded-[2px] bg-emerald-500/70")} />
        <span className="text-[9px] font-bold text-muted-foreground/40">More</span>
      </div>
    </div>
    </TooltipProvider>
  );
}
