"use client";

import { format, isToday, isYesterday, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Circle,
  History,
  Loader2,
  Maximize2,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { EASE_OUT } from "@/components/daily/full-calendar/animations";
import { PlateEditor } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  useCreateDailyLog,
  useCreateDailyTask,
  useDailyLogDetail,
  useDeleteDailyTask,
  useUpdateDailyLog,
  useUpdateDailyTask,
  usePomodoroSessions,
  useUserSubjects,
} from "@/hooks/use-daily";
import { cn } from "@/lib/utils";

function extractPlateText(nodes: any[]): string {
  if (!Array.isArray(nodes)) return "";
  const parts: string[] = [];
  const walk = (node: any) => {
    if (typeof node?.text === "string") parts.push(node.text);
    else if (Array.isArray(node?.children)) node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return parts.join(" ").trim();
}

type TaskTab = "habits" | "tasks" | "focus";

function FrequencyTag({
  frequency,
  weekDays,
  monthDays,
}: {
  frequency?: string;
  weekDays?: string[];
  monthDays?: string[];
}) {
  if (!frequency) return null;
  if (frequency === "Daily")
    return (
      <Badge className="bg-primary/8 text-primary text-[9px] font-semibold px-1.5 py-0 rounded-md">
        Daily
      </Badge>
    );
  if (frequency === "Weekly") {
    const label = weekDays?.length
      ? weekDays.map((d) => d.slice(0, 3)).join(", ")
      : "Weekly";
    return (
      <Badge className="bg-blue-500/8 text-blue-500 text-[9px] font-semibold px-1.5 py-0 rounded-md">
        {label}
      </Badge>
    );
  }
  if (frequency === "Monthly") {
    const label = monthDays?.length ? monthDays.join(", ") : "Monthly";
    return (
      <Badge className="bg-amber-500/8 text-amber-500 text-[9px] font-semibold px-1.5 py-0 rounded-md">
        {label}
      </Badge>
    );
  }
  return null;
}

function TaskItem({
  task,
  onUpdate,
  onDelete,
  showHabitBadge,
}: {
  task: any;
  onUpdate: (p: any) => void;
  onDelete: () => void;
  showHabitBadge?: boolean;
}) {
  const [text, setText] = useState(task.text ?? "");
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15, ease: EASE_OUT }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        task.is_completed ? "bg-muted/10" : "hover:bg-muted/30",
      )}
    >
      <div className="relative shrink-0">
        <Checkbox
          checked={task.is_completed}
          onCheckedChange={(c) => onUpdate({ is_completed: !!c })}
          className={cn(
            "size-[18px] rounded-md shrink-0 transition-all duration-200",
            task.is_completed
              ? "bg-primary border-primary"
              : "border-muted-foreground/30 hover:border-primary/50",
          )}
        />
        {task.is_completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <CheckCircle2 className="size-3.5 text-white" />
          </motion.div>
        )}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== task.text) onUpdate({ text });
        }}
        className={cn(
          "flex-1 bg-transparent border-none focus:outline-none text-[13px] font-medium cursor-text transition-all",
          task.is_completed
            ? "line-through text-muted-foreground/40"
            : "text-foreground placeholder:text-muted-foreground/30",
        )}
      />
      {showHabitBadge && task.habit && (
        <FrequencyTag
          frequency={task.habit.frequency}
          weekDays={task.habit.week_days}
          monthDays={task.habit.month_days}
        />
      )}
      {task.habit_id && !showHabitBadge && (
        <Target className="size-3.5 text-primary/40 shrink-0" />
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className={cn(
          "size-7 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/8 shrink-0 transition-all duration-200",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      >
        <Trash2 className="size-4" />
      </Button>
    </motion.div>
  );
}

export function DailyLogView({
  date,
  workspaceId,
}: {
  date: string;
  workspaceId?: string;
}) {
  const { data, isLoading, refetch } = useDailyLogDetail(date, workspaceId);
  const updateLog = useUpdateDailyLog(data?.log?.id || "");
  const createTask = useCreateDailyTask();
  const updateTask = useUpdateDailyTask();
  const deleteTask = useDeleteDailyTask();
  const createLog = useCreateDailyLog();

  const [tab, setTab] = useState<TaskTab>("tasks");
  const [newTaskText, setNewTaskText] = useState("");
  const [highlight, setHighlight] = useState("");
  const [editorContent, setEditorContent] = useState<any[] | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditorMaximized, setIsEditorMaximized] = useState(false);

  const { data: pomodoroData } = usePomodoroSessions(date);
  const { data: subjectsData } = useUserSubjects();
  const sessions = pomodoroData?.sessions || [];
  const subjects = subjectsData?.subjects || [];

  const totalFocusSeconds = sessions.reduce((acc: number, s: any) => acc + (s.actual_duration_seconds || 0), 0);
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);

  const log = data?.log;

  const habitTasks = log?.tasks?.filter((t) => t.habit_id) ?? [];
  const manualTasks = log?.tasks?.filter((t) => !t.habit_id) ?? [];
  const currentTasks = tab === "habits" ? habitTasks : manualTasks;
  const completedCount = currentTasks.filter((t) => t.is_completed).length;
  const totalCount = currentTasks.length;

  useEffect(() => {
    if (log) {
      setHighlight(log.highlight || "");
      setEditorContent(
        log.content || [{ type: "p", children: [{ text: "" }] }],
      );
    }
  }, [log]);

  useEffect(() => {
    if (!isDirty || !log) return;
    const timer = setTimeout(() => {
      updateLog.mutate({
        highlight: highlight.trim() || null,
        content: editorContent,
        contentText: extractPlateText(editorContent ?? []),
      });
      setIsDirty(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [highlight, editorContent, isDirty, log, updateLog]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !log) return;
    createTask.mutate(
      { logId: log.id, text: newTaskText.trim() },
      {
        onSuccess: () => {
          setNewTaskText("");
          refetch();
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="relative">
          <div className="size-14 rounded-2xl bg-muted/30 flex items-center justify-center">
            <Loader2 className="size-6 text-primary/40 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-primary/10 animate-pulse" />
        </div>
        <p className="text-[13px] text-muted-foreground/50 font-medium">
          Loading your day...
        </p>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="relative mb-6"
        >
          <div className="size-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <History className="size-9 text-primary/40" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border-2 border-border/20 flex items-center justify-center">
            <Plus className="size-3.5 text-muted-foreground/50" />
          </div>
        </motion.div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: EASE_OUT }}
        >
          <p className="text-[16px] font-semibold text-foreground mb-2">
            Start your day journal
          </p>
          <p className="text-[13px] text-muted-foreground/60 mb-8 max-w-[260px]">
            Track your daily highlights, tasks, habits, and reflections for{" "}
            {format(parseISO(date), "MMMM d")}
          </p>
          <Button
            onClick={() => createLog.mutate({ date, workspaceId })}
            disabled={createLog.isPending}
            className="h-11 px-6 rounded-xl font-semibold text-[13px] bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
          >
            {createLog.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="size-4 mr-2" />
            )}
            Start Daily Log
          </Button>
        </motion.div>
      </div>
    );
  }

  const getDateLabel = (d: string) => {
    const parsed = parseISO(d);
    if (isToday(parsed)) return "Today";
    if (isYesterday(parsed)) return "Yesterday";
    return format(parsed, "MMMM d, yyyy");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Enhanced Header */}
      <div className="px-5 py-4 border-b border-border/4 flex items-center justify-between shrink-0 bg-gradient-to-b from-background to-muted/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8">
            <Calendar className="size-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              Daily
            </span>
          </div>
          <ArrowRight className="size-3 text-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold text-foreground">
              {getDateLabel(date)}
            </span>
            <Badge
              variant="secondary"
              className="text-[10px] font-medium px-2 py-0 rounded-md bg-muted/50 text-muted-foreground"
            >
              {format(parseISO(date), "EEE")}
            </Badge>
          </div>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors",
                completedCount === totalCount
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted/40 text-muted-foreground",
              )}
            >
              {completedCount === totalCount ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <Circle className="size-3" />
              )}
              {completedCount}/{totalCount}
            </div>
          </div>
        )}
      </div>

      {/* Focus / Highlight */}
      <div className="px-5 py-4 border-b border-border/4">
        <div className="relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
            <Sparkles className="size-3 text-primary" />
          </div>
          <input
            value={highlight}
            onChange={(e) => {
              setHighlight(e.target.value);
              setIsDirty(true);
            }}
            placeholder="What's your main focus today?"
            className="w-full pl-9 pr-4 py-2 bg-muted/20 rounded-lg text-[14px] font-medium placeholder:text-muted-foreground/40 focus:outline-none focus:bg-muted/30 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-5 pt-4 pb-0 shrink-0">
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl w-fit">
          {(["tasks", "habits", "focus"] as TaskTab[]).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-lg transition-all duration-200 ease-out-quart",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20",
              )}
            >
              {t === "tasks" ? (
                <Sparkles
                  className={cn(
                    "size-3.5",
                    tab === "tasks"
                      ? "text-primary"
                      : "text-muted-foreground/40",
                  )}
                />
              ) : t === "habits" ? (
                <Target
                  className={cn(
                    "size-3.5",
                    tab === "habits"
                      ? "text-primary"
                      : "text-muted-foreground/40",
                  )}
                />
              ) : (
                <History
                  className={cn(
                    "size-3.5",
                    tab === "focus"
                      ? "text-primary"
                      : "text-muted-foreground/40",
                  )}
                />
              )}
              {t === "tasks" ? "Tasks" : t === "habits" ? "Habits" : "Focus"}
              {t === "tasks" && manualTasks.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    tab === "tasks"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground/60",
                  )}
                >
                  {manualTasks.filter((h) => h.is_completed).length}/
                  {manualTasks.length}
                </span>
              )}
              {t === "habits" && habitTasks.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    tab === "habits"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground/60",
                  )}
                >
                  {habitTasks.filter((h) => h.is_completed).length}/
                  {habitTasks.length}
                </span>
              )}
              {t === "focus" && sessions.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    tab === "focus"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground/60",
                  )}
                >
                  {sessions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-3">
        <AnimatePresence mode="wait">
          {tab === "focus" ? (
            <motion.div
              key="focus-timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {/* Focus Summary Card */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-1">Total Focus</p>
                  <p className="text-xl font-bold tracking-tight">{totalFocusMinutes}m</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Sessions</p>
                  <p className="text-xl font-bold tracking-tight">{sessions.length}</p>
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                    <History className="size-6 text-muted-foreground/20" />
                  </div>
                  <p className="text-[13px] font-semibold text-foreground mb-1">No focus sessions</p>
                  <p className="text-[12px] text-muted-foreground/60 max-w-[200px]">Time focused on this day will appear here</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border/10">
                  {sessions.map((session: any) => {
                    const subject = subjects.find(s => s.id === session.subject_id);
                    const startStr = format(parseISO(session.start_time), "h:mm a");
                    const endStr = session.end_time ? format(parseISO(session.end_time), "h:mm a") : "?";
                    const durationMins = Math.round((session.actual_duration_seconds || 0) / 60);

                    return (
                      <div key={session.id} className="relative">
                        <div className="absolute -left-[20px] top-1.5 size-[11px] rounded-full bg-background border-[2px] border-primary shadow-[0_0_0_3px_rgba(var(--primary-rgb),0.1)]" />
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-foreground">
                              {session.type}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground/60">
                              {startStr} — {endStr}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {subject && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 border border-border/5">
                                <div className="size-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                                <span className="text-[10px] font-bold text-muted-foreground/80">{subject.name}</span>
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{durationMins}m Focused</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : currentTasks.length === 0 && tab === "habits" ? (
            <motion.div
              key="empty-habits"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="relative mb-4">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                  <Target className="size-6 text-muted-foreground/30" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                </div>
              </div>
              <p className="text-[13px] font-semibold text-foreground mb-1">
                No habits scheduled
              </p>
              <p className="text-[12px] text-muted-foreground/60 max-w-[200px]">
                Create habits in the Habits tab to build consistent routines
              </p>
            </motion.div>
          ) : currentTasks.length === 0 && tab === "tasks" ? (
            <motion.div
              key="empty-tasks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="relative mb-4">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                  <Sparkles className="size-6 text-primary/40" />
                </div>
              </div>
              <p className="text-[13px] font-semibold text-foreground mb-1">
                Ready for action
              </p>
              <p className="text-[12px] text-muted-foreground/60 max-w-[200px]">
                Add tasks below to track what you want to accomplish today
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
              className="space-y-0.5"
            >
              {currentTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  showHabitBadge={tab === "habits"}
                  onUpdate={(payload) =>
                    updateTask.mutate(
                      { taskId: task.id, payload },
                      { onSuccess: () => refetch() },
                    )
                  }
                  onDelete={() =>
                    deleteTask.mutate(task.id, { onSuccess: () => refetch() })
                  }
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Task - only in tasks tab */}
        <AnimatePresence>
          {tab === "tasks" && (
            <motion.form
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              onSubmit={handleAddTask}
              className="flex items-center gap-3 px-3 py-3 mt-3 rounded-xl bg-muted/20 border border-dashed border-muted-foreground/15 hover:border-muted-foreground/30 hover:bg-muted/30 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-md bg-muted-foreground/10">
                <Plus className="size-3 text-muted-foreground/40" />
              </div>
              <input
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 bg-transparent border-none focus:outline-none text-[13px] font-medium placeholder:text-muted-foreground/30 text-foreground"
              />
              <Button
                type="submit"
                size="sm"
                className={cn(
                  "h-7 text-[11px] font-semibold px-3 rounded-md shrink-0 transition-all duration-200",
                  newTaskText.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground/40 cursor-not-allowed",
                )}
                disabled={!newTaskText.trim()}
              >
                Add
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Reflection */}
      <div className="px-5 py-4 border-t border-border/4 shrink-0 bg-muted/10/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10">
              <MessageSquare className="size-3.5 text-amber-500/70" />
            </div>
            <span className="text-[12px] font-semibold text-foreground">
              Daily Reflection
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditorMaximized(true)}
            className="size-7 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
        <div className="min-h-[140px] bg-background/50 rounded-xl border border-border/20 p-3 hover:border-border/40 transition-colors">
          <PlateEditor
            content={editorContent}
            onChange={(val) => {
              setEditorContent(val);
              setIsDirty(true);
            }}
            editorClassName="text-[13px] leading-relaxed outline-none min-h-[120px] placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {/* Maximized Editor */}
      <Dialog open={isEditorMaximized} onOpenChange={setIsEditorMaximized}>
        <AnimatePresence mode="wait">
          {isEditorMaximized && (
            <DialogContent
              className="rounded-2xl border-border/10 shadow-modal flex flex-col bg-background overflow-hidden w-full max-w-[calc(100%-2rem)] sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-[75vw] h-[85vh]"
            >
              <DialogTitle className="sr-only">Reflection Editor</DialogTitle>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/5 shrink-0">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageSquare className="size-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">
                    Reflection
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditorMaximized(false)}
                  className="size-7 rounded-full"
                >
                  <Sparkles className="size-3" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-5">
                <PlateEditor
                  content={editorContent}
                  onChange={(val) => {
                    setEditorContent(val);
                    setIsDirty(true);
                  }}
                  editorClassName="text-[15px] leading-relaxed outline-none min-h-[60vh]"
                />
              </div>
            </DialogContent>
          )}
        </AnimatePresence>
      </Dialog>
    </div>
  );
}
