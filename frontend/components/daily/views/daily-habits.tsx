"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Plus,
  Settings2,
  Target,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  EASE_OUT,
  staggerContainer,
  staggerItem,
} from "@/components/daily/full-calendar/animations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateHabit,
  useDeleteHabit,
  useHabitLogs,
  useHabits,
  useToggleHabitLog,
} from "@/hooks/use-daily";
import type { HabitItem } from "@/lib/api/daily";
import { cn } from "@/lib/utils";

type Frequency = "Daily" | "Weekly" | "Monthly";

const FREQ_LABELS: Record<Frequency, string> = {
  Daily: "Daily",
  Weekly: "Weekly",
  Monthly: "Monthly",
};

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

function FrequencySelect({
  value,
  onChange,
}: {
  value: Frequency;
  onChange: (f: Frequency) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between gap-2 h-10 px-3 rounded-xl bg-card border border-border/10 text-[13px] font-medium w-full",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all",
        )}
      >
        <span>{FREQ_LABELS[value]}</span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
            className="absolute top-full left-0 right-0 mt-1.5 z-20 bg-popover rounded-xl border border-border/10 shadow-modal overflow-hidden"
          >
            {(Object.keys(FREQ_LABELS) as Frequency[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onChange(f);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 text-[13px] font-medium transition-colors",
                  "hover:bg-accent",
                  value === f && "text-primary bg-primary/5",
                )}
              >
                {FREQ_LABELS[f]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GearPopover({
  weekdayDays,
  weekendDays,
  onWeekdayChange,
  onWeekendChange,
}: {
  weekdayDays: string[];
  weekendDays: string[];
  onWeekdayChange: (days: string[]) => void;
  onWeekendChange: (days: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleDay = (
    day: string,
    current: string[],
    setter: (d: string[]) => void,
  ) => {
    setter(
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day],
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-10 w-10 rounded-xl bg-card border border-border/10 text-muted-foreground",
          "flex items-center justify-center shrink-0",
          "hover:text-foreground hover:border-border/30 transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        )}
      >
        <Settings2 className="size-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
            className="absolute top-full right-0 mt-1.5 z-20 bg-popover rounded-xl border border-border/10 shadow-modal p-4 w-[280px]"
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Define Your Week
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-medium mb-2">Weekdays</p>
                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        toggleDay(day, weekdayDays, onWeekdayChange)
                      }
                      className={cn(
                        "h-7 min-w-[36px] px-2 rounded-lg text-[11px] font-semibold transition-all duration-150",
                        weekdayDays.includes(day)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium mb-2">Weekends</p>
                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        toggleDay(day, weekendDays, onWeekendChange)
                      }
                      className={cn(
                        "h-7 min-w-[36px] px-2 rounded-lg text-[11px] font-semibold transition-all duration-150",
                        weekendDays.includes(day)
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DayToggle({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "h-8 min-w-[40px] px-2 rounded-lg text-[12px] font-semibold transition-all duration-150",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {label}
    </button>
  );
}

function MonthDayToggle({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "h-7 min-w-[28px] px-1.5 rounded-md text-[11px] font-medium transition-all duration-150",
        selected
          ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {label}
    </button>
  );
}

function FrequencyLabel({
  frequency,
  weekDays,
  monthDays,
}: {
  frequency: Frequency;
  weekDays: string[];
  monthDays: string[];
}) {
  if (frequency === "Daily") {
    return (
      <Badge className="bg-primary/8 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0">
        Daily
      </Badge>
    );
  }
  if (frequency === "Weekly") {
    const label =
      weekDays.length > 0
        ? weekDays.map((d) => d.slice(0, 3)).join(", ")
        : "Weekly";
    return (
      <Badge className="bg-blue-500/8 text-blue-500 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0">
        {label}
      </Badge>
    );
  }
  if (frequency === "Monthly") {
    const label = monthDays.length > 0 ? monthDays.join(", ") : "Monthly";
    return (
      <Badge className="bg-amber-500/8 text-amber-500 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0">
        {label}
      </Badge>
    );
  }
  return null;
}

export function DailyHabits() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: habitsData, isLoading: habitsLoading } = useHabits();
  const { data: logsData, isLoading: logsLoading } = useHabitLogs(today, today);
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const toggleLog = useToggleHabitLog();

  const [input, setInput] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Daily");
  const [weekDays, setWeekDays] = useState<string[]>([]);
  const [monthDays, setMonthDays] = useState<string[]>([]);
  const [weekdayConfig, setWeekdayConfig] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  const [weekendConfig, setWeekendConfig] = useState<string[]>([
    "Saturday",
    "Sunday",
  ]);
  const [formExpanded, setFormExpanded] = useState(false);

  const habits = habitsData?.habits ?? [];
  const todayLogs = logsData?.logs ?? [];
  const isDone = (id: string) =>
    todayLogs.some((l) => l.habit_id === id && l.completed);
  const done = habits.filter((h) => isDone(h.id)).length;
  const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || createHabit.isPending) return;
    if (frequency === "Weekly" && weekDays.length === 0) return;
    if (frequency === "Monthly" && monthDays.length === 0) return;
    createHabit.mutate(
      {
        text: input.trim(),
        frequency,
        week_days: weekDays,
        month_days: monthDays,
      },
      {
        onSuccess: () => {
          setInput("");
          setFrequency("Daily");
          setWeekDays([]);
          setMonthDays([]);
          setFormExpanded(false);
        },
      },
    );
  };

  if (habitsLoading || logsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="size-7 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
      <div className="max-w-xl mx-auto px-6 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="space-y-0.5"
        >
          <h2 className="text-[24px] font-bold tracking-tight leading-none">
            Habits
          </h2>
          <p className="text-sm text-muted-foreground leading-none">
            Build routines that stick.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06, ease: EASE_OUT }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 pointer-events-none z-10" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setFormExpanded(true)}
                  placeholder="New habit..."
                  className="h-10 pl-10 pr-3 rounded-xl bg-card border-border/10 text-[14px] focus-visible:ring-2 focus-visible:ring-primary/20"
                  disabled={createHabit.isPending}
                />
              </div>
              <FrequencySelect value={frequency} onChange={setFrequency} />
              <GearPopover
                weekdayDays={weekdayConfig}
                weekendDays={weekendConfig}
                onWeekdayChange={setWeekdayConfig}
                onWeekendChange={setWeekendConfig}
              />
              <Button
                type="submit"
                disabled={
                  !input.trim() ||
                  createHabit.isPending ||
                  (frequency === "Weekly" && weekDays.length === 0) ||
                  (frequency === "Monthly" && monthDays.length === 0)
                }
                className="h-10 px-5 rounded-xl font-semibold text-[13px] shrink-0"
              >
                {createHabit.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
            </div>

            <AnimatePresence>
              {formExpanded && frequency === "Weekly" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Which days?
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEK_DAYS.map((day) => (
                      <DayToggle
                        key={day}
                        label={day.slice(0, 3)}
                        selected={weekDays.includes(day)}
                        onToggle={() =>
                          setWeekDays((prev) =>
                            prev.includes(day)
                              ? prev.filter((d) => d !== day)
                              : [...prev, day],
                          )
                        }
                      />
                    ))}
                  </div>
                  {weekDays.length === 0 && (
                    <p className="text-[12px] text-muted-foreground mt-2">
                      Pick at least one day.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {formExpanded && frequency === "Monthly" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Which days of the month?
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {MONTH_DAYS.map((d) => (
                      <MonthDayToggle
                        key={d}
                        label={d}
                        selected={monthDays.includes(d)}
                        onToggle={() =>
                          setMonthDays((prev) =>
                            prev.includes(d)
                              ? prev.filter((x) => x !== d)
                              : [...prev, d],
                          )
                        }
                      />
                    ))}
                  </div>
                  {monthDays.length === 0 && (
                    <p className="text-[12px] text-muted-foreground mt-2">
                      Pick at least one day.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {habits.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="size-12 rounded-xl bg-muted/40 flex items-center justify-center mb-4">
                <Target className="size-5 text-muted-foreground/25" />
              </div>
              <p className="text-[15px] font-semibold mb-1">No habits yet</p>
              <p className="text-[13px] text-muted-foreground max-w-[200px]">
                Add a habit above to start building your routine.
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="flex items-center gap-4"
              >
                <span className="text-[13px] font-semibold text-foreground shrink-0">
                  {done}/{habits.length}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: EASE_OUT }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                  {pct}%
                </span>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-1"
              >
                {habits.map((habit) => {
                  const done2 = isDone(habit.id);
                  return (
                    <motion.div key={habit.id} variants={staggerItem} layout>
                      <HabitRow
                        habit={habit}
                        done={done2}
                        onToggle={() =>
                          toggleLog.mutate({
                            habitId: habit.id,
                            date: today,
                            completed: !done2,
                          })
                        }
                        onDelete={() => deleteHabit.mutate(habit.id)}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HabitRow({
  habit,
  done,
  onToggle,
  onDelete,
}: {
  habit: HabitItem;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-transparent",
        "transition-all duration-150",
        "hover:border-border/20",
        done && "opacity-50",
      )}
    >
      <button
        onClick={onToggle}
        type="button"
        className="shrink-0 focus:outline-none"
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="c"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.1, ease: EASE_OUT }}
            >
              <CheckCircle2 className="size-[22px] text-emerald-500" />
            </motion.div>
          ) : (
            <motion.div
              key="o"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.1, ease: EASE_OUT }}
            >
              <Circle className="size-[22px] text-border transition-colors group-hover:text-muted-foreground/40" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <span
        className={cn(
          "flex-1 text-[14px] font-medium leading-none truncate",
          done && "line-through text-muted-foreground/40",
        )}
      >
        {habit.text}
      </span>

      <FrequencyLabel
        frequency={habit.frequency as Frequency}
        weekDays={habit.week_days ?? []}
        monthDays={habit.month_days ?? []}
      />

      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="size-7 rounded-lg text-muted-foreground/20 hover:text-destructive hover:bg-destructive/8 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
