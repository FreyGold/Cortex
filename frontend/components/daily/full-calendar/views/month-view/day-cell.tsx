"use client";

import { cva } from "class-variance-authority";
import {
  endOfMonth,
  format,
  isSunday,
  isToday,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  History as HistoryIcon,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DailyLogModal } from "@/components/daily/daily-log-modal";
import { transition } from "@/components/daily/full-calendar/animations";
import { DroppableArea } from "@/components/daily/full-calendar/dnd/droppable-area";
import { useMediaQuery } from "@/components/daily/full-calendar/hooks";
import type {
  ICalendarCell,
  IEvent,
} from "@/components/daily/full-calendar/interfaces";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  useCreateDailyLog,
  useCreateDailyTask,
  useDailyLogs,
  useUpdateDailyTask,
} from "@/hooks/use-daily";
import { cn } from "@/lib/utils";

interface IProps {
  cell: ICalendarCell;
  events: IEvent[];
  eventPositions: Record<string, number>;
}

export const dayCellVariants = cva("text-white", {
  variants: {
    color: {
      blue: "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 ",
      green:
        "bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-400",
      red: "bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-400",
      yellow:
        "bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 dark:hover:bg-yellow-400",
      purple:
        "bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-400",
      orange:
        "bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-400",
      gray: "bg-gray-600 dark:bg-gray-500 hover:bg-gray-700 dark:hover:bg-gray-400",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

export function DayCell({ cell, events }: IProps) {
  const { day, currentMonth, date } = cell;
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || undefined;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickTaskText, setQuickTaskText] = useState("");

  const createLog = useCreateDailyLog();
  const createTask = useCreateDailyTask();
  const updateTask = useUpdateDailyTask();

  const dateStr = format(date, "yyyy-MM-dd");

  const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");
  const { data } = useDailyLogs(monthStart, monthEnd, workspaceId);

  const logData = useMemo(() => {
    return data?.logs?.find((l: any) => l.date === dateStr);
  }, [data, dateStr]);

  const tasks = logData?.tasks || [];
  const focusSessions = logData?.pomodoro_sessions || [];

  const totalFocusMinutes = useMemo(() => {
    const seconds = focusSessions.reduce((acc: number, s: any) => acc + (s.actual_duration_seconds || 0), 0);
    return Math.round(seconds / 60);
  }, [focusSessions]);

  const heatmapOpacity = useMemo(() => {
    if (totalFocusMinutes === 0) return 0;
    if (totalFocusMinutes < 60) return 0.05;
    if (totalFocusMinutes < 120) return 0.1;
    if (totalFocusMinutes < 240) return 0.2;
    return 0.3;
  }, [totalFocusMinutes]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskText.trim()) return;

    let targetLogId = logData?.id;

    if (!targetLogId) {
      const res = await createLog.mutateAsync({ date: dateStr, workspaceId });
      targetLogId = res.log.id;
    }

    await createTask.mutateAsync({
      logId: targetLogId,
      text: quickTaskText.trim(),
    });
    setQuickTaskText("");
    setIsQuickAddOpen(false);
  };

  const handleMoveUnfinished = async () => {
    const unfinished = tasks.filter((t: any) => !t.is_completed);
    if (unfinished.length === 0) return;

    const tomorrowStr = format(subDays(date, -1), "yyyy-MM-dd");
    let targetLogId: string;

    const tomorrowLog = data?.logs?.find((l: any) => l.date === tomorrowStr);
    if (tomorrowLog) {
      targetLogId = tomorrowLog.id;
    } else {
      const res = await createLog.mutateAsync({
        date: tomorrowStr,
        workspaceId,
      });
      targetLogId = res.log.id;
    }

    for (const task of unfinished) {
      await createTask.mutateAsync({ logId: targetLogId, text: task.text });
    }
  };

  const handleCopyYesterday = async () => {
    const yesterdayStr = format(subDays(date, 1), "yyyy-MM-dd");
    const yesterdayLog = data?.logs?.find((l: any) => l.date === yesterdayStr);
    if (!yesterdayLog || !yesterdayLog.tasks?.length) return;

    let targetLogId = logData?.id;
    if (!targetLogId) {
      const res = await createLog.mutateAsync({ date: dateStr, workspaceId });
      targetLogId = res.log.id;
    }

    for (const task of yesterdayLog.tasks) {
      await createTask.mutateAsync({ logId: targetLogId, text: task.text });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          className={cn(
            "flex h-full lg:min-h-[160px] flex-col gap-1 border-l border-t relative group/cell cursor-pointer transition-colors duration-500",
            isSunday(date) && "border-l-0",
            !currentMonth && "bg-muted/5 opacity-40",
            logData && "bg-primary/[0.02]",
          )}
          style={{
            backgroundColor: heatmapOpacity > 0 ? `rgba(var(--primary-rgb), ${heatmapOpacity})` : undefined
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          onClick={() => setIsModalOpen(true)}
        >
          <DroppableArea
            date={date}
            className="w-full h-full p-2 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "size-6 flex items-center justify-center text-[11px] font-bold transition-all",
                  !currentMonth && "opacity-20",
                  isToday(date)
                    ? "rounded-full bg-primary text-primary-foreground shadow-sm scale-110"
                    : "text-muted-foreground/60 group-hover/cell:text-foreground",
                )}
              >
                {day}
              </span>

              <div className="flex items-center gap-1.5">
                {totalFocusMinutes > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/10">
                    <HistoryIcon className="size-2 text-primary" />
                    <span className="text-[9px] font-bold text-primary">
                      {totalFocusMinutes >= 60 ? `${(totalFocusMinutes / 60).toFixed(1)}h` : `${totalFocusMinutes}m`}
                    </span>
                  </div>
                )}
                {logData?.rating && (
                  <span className="text-xs">{logData.rating}</span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-1 overflow-hidden">
              {tasks.slice(0, 3).map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-center gap-1.5 min-w-0"
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="size-2.5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-2.5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      "text-[10px] truncate leading-tight font-medium",
                      task.is_completed
                        ? "text-muted-foreground/40 line-through"
                        : "text-muted-foreground group-hover/cell:text-foreground/80",
                    )}
                  >
                    {task.text}
                  </span>
                </div>
              ))}
              {tasks.length > 3 && (
                <span className="text-[9px] text-muted-foreground/40 font-bold pl-4">
                  +{tasks.length - 3} more
                </span>
              )}
              {tasks.length === 0 && !isQuickAddOpen && (
                <div className="h-full flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQuickAddOpen(true);
                    }}
                  >
                    <Plus className="size-3 text-muted-foreground" />
                  </Button>
                </div>
              )}
            </div>

            {isQuickAddOpen && (
              <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleQuickAdd}>
                  <input
                    autoFocus
                    value={quickTaskText}
                    onChange={(e) => setQuickTaskText(e.target.value)}
                    onBlur={() => !quickTaskText && setIsQuickAddOpen(false)}
                    placeholder="Add task..."
                    className="w-full bg-accent/50 border-none rounded-md px-1.5 py-0.5 text-[10px] outline-none placeholder:text-muted-foreground/50"
                  />
                </form>
              </div>
            )}
          </DroppableArea>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 rounded-xl">
        <ContextMenuItem className="gap-2" onClick={() => setIsModalOpen(true)}>
          <FileText className="size-4" />
          Open Daily Log
        </ContextMenuItem>
        {!logData && (
          <ContextMenuItem
            className="gap-2"
            onClick={() => createLog.mutate({ date: dateStr, workspaceId })}
          >
            <Plus className="size-4" />
            Create Record
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          className="gap-2"
          onClick={() => setIsQuickAddOpen(true)}
        >
          <ClipboardList className="size-4" />
          Add Quick Task
        </ContextMenuItem>
        <ContextMenuItem className="gap-2" onClick={handleCopyYesterday}>
          <HistoryIcon className="size-4" />
          Copy Yesterday's Routine
        </ContextMenuItem>
        <ContextMenuItem className="gap-2" onClick={handleMoveUnfinished}>
          <MoreHorizontal className="size-4" />
          Move Unfinished to Tomorrow
        </ContextMenuItem>
      </ContextMenuContent>
      <DailyLogModal
        date={dateStr}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        workspaceId={workspaceId}
      />
    </ContextMenu>
  );
}
