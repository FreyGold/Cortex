"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  Plus,
  Settings2,
  Target,
  Trash2,
  X,
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
import { useCreateHabit, useDeleteHabit, useHabits } from "@/hooks/use-daily";
import type { HabitItem } from "@/lib/api/daily";
import { cn } from "@/lib/utils";

type Frequency = "Daily" | "Weekly" | "Monthly";

const FREQ_LABELS: Record<Frequency, string> = {
  Daily: "Daily",
  Weekly: "Weekly",
  Monthly: "Monthly",
};

const WEEK_DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const WEEK_DAYS_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const WEEK_DAY_MAP: Record<string, string> = {
  Su: "Sunday",
  Mo: "Monday",
  Tu: "Tuesday",
  We: "Wednesday",
  Th: "Thursday",
  Fr: "Friday",
  Sa: "Saturday",
};
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

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
          "flex items-center justify-between gap-2 h-9 px-3 rounded-xl bg-muted/50 border border-border/10 text-[12px] font-medium",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all",
        )}
      >
        <span>{FREQ_LABELS[value]}</span>
        <ChevronDown
          className={cn(
            "size-3 text-muted-foreground shrink-0 transition-transform",
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
            className="absolute top-full left-0 mt-1.5 z-20 bg-popover rounded-xl border border-border/10 shadow-modal overflow-hidden min-w-[120px]"
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
                  "w-full text-left px-3 py-2 text-[12px] font-medium transition-colors",
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
          "h-9 w-9 rounded-xl bg-muted/50 border border-border/10 text-muted-foreground",
          "flex items-center justify-center shrink-0",
          "hover:text-foreground hover:border-border/30 transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        )}
      >
        <Settings2 className="size-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: EASE_OUT }}
            className="absolute top-full right-0 mt-1.5 z-20 bg-popover rounded-xl border border-border/10 shadow-modal p-3 w-[260px]"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Define Your Week
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-medium mb-1.5">Weekdays</p>
                <div className="flex flex-wrap gap-1">
                  {WEEK_DAYS_SHORT.map((shortDay) => (
                    <button
                      key={shortDay}
                      type="button"
                      onClick={() =>
                        toggleDay(
                          WEEK_DAY_MAP[shortDay],
                          weekdayDays,
                          onWeekdayChange,
                        )
                      }
                      className={cn(
                        "h-6 min-w-[32px] px-1.5 rounded-md text-[10px] font-semibold transition-all duration-150",
                        weekdayDays.includes(WEEK_DAY_MAP[shortDay])
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {shortDay}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium mb-1.5">Weekends</p>
                <div className="flex flex-wrap gap-1">
                  {WEEK_DAYS_SHORT.map((shortDay) => (
                    <button
                      key={shortDay}
                      type="button"
                      onClick={() =>
                        toggleDay(
                          WEEK_DAY_MAP[shortDay],
                          weekendDays,
                          onWeekendChange,
                        )
                      }
                      className={cn(
                        "h-6 min-w-[32px] px-1.5 rounded-md text-[10px] font-semibold transition-all duration-150",
                        weekendDays.includes(WEEK_DAY_MAP[shortDay])
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {shortDay}
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

function SmallToggle({
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
        "h-6 min-w-[28px] px-1.5 rounded-md text-[10px] font-semibold transition-all duration-150",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {label}
    </button>
  );
}

function FrequencyBadge({
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
      <Badge className="bg-primary/8 text-primary text-[10px] font-semibold px-1.5 py-0 rounded-md shrink-0">
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
      <Badge className="bg-blue-500/8 text-blue-500 text-[10px] font-semibold px-1.5 py-0 rounded-md shrink-0">
        {label}
      </Badge>
    );
  }
  if (frequency === "Monthly") {
    const label = monthDays.length > 0 ? monthDays.join(", ") : "Monthly";
    return (
      <Badge className="bg-amber-500/8 text-amber-500 text-[10px] font-semibold px-1.5 py-0 rounded-md shrink-0">
        {label}
      </Badge>
    );
  }
  return null;
}

interface HabitsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HabitsModal({ isOpen, onOpenChange }: HabitsModalProps) {
  const { data: habitsData, isLoading: habitsLoading } = useHabits();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();

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

  const habits = habitsData?.habits ?? [];

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
        },
      },
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed inset-0 z-50 bg-background/30 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-2xl shadow-modal overflow-hidden flex flex-col"
            style={{ width: "42vw", height: "80vh" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Target className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold leading-none">Habits</h2>
                  <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                    Build routines that stick
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-5 py-4 space-y-4">
                {habitsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="size-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Add form */}
                    <form onSubmit={handleSubmit} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/30 pointer-events-none z-10" />
                          <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="New habit..."
                            className="h-9 pl-9 pr-3 rounded-xl bg-muted/50 border-border/10 text-[13px] focus-visible:ring-2 focus-visible:ring-primary/20"
                            disabled={createHabit.isPending}
                          />
                        </div>
                        <FrequencySelect
                          value={frequency}
                          onChange={setFrequency}
                        />
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
                          className="h-9 px-4 rounded-xl font-semibold text-[12px] shrink-0"
                        >
                          {createHabit.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Add"
                          )}
                        </Button>
                      </div>

                      <AnimatePresence>
                        {frequency === "Weekly" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15, ease: EASE_OUT }}
                            className="overflow-hidden"
                          >
                            <p className="text-[10px] text-muted-foreground mb-1">
                              Days
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {WEEK_DAYS_SHORT.map((shortDay) => (
                                <SmallToggle
                                  key={shortDay}
                                  label={shortDay}
                                  selected={weekDays.includes(
                                    WEEK_DAY_MAP[shortDay],
                                  )}
                                  onToggle={() =>
                                    setWeekDays((prev) => {
                                      const full = WEEK_DAY_MAP[shortDay];
                                      return prev.includes(full)
                                        ? prev.filter((d) => d !== full)
                                        : [...prev, full];
                                    })
                                  }
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {frequency === "Monthly" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15, ease: EASE_OUT }}
                            className="overflow-hidden"
                          >
                            <p className="text-[10px] text-muted-foreground mb-2">
                              Select days
                            </p>
                            <div className="grid grid-cols-7 gap-1">
                              {MONTH_DAYS.map((d) => (
                                <SmallToggle
                                  key={d}
                                  label={String(d)}
                                  selected={monthDays.includes(String(d))}
                                  onToggle={() =>
                                    setMonthDays((prev) =>
                                      prev.includes(String(d))
                                        ? prev.filter((x) => x !== String(d))
                                        : [...prev, String(d)],
                                    )
                                  }
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>

                    {/* List */}
                    {habits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="size-10 rounded-xl bg-muted/40 flex items-center justify-center mb-3">
                          <Target className="size-4 text-muted-foreground/25" />
                        </div>
                        <p className="text-[13px] font-semibold mb-0.5">
                          No habits yet
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Add a habit above to start building your routine.
                        </p>
                      </div>
                    ) : (
                      <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                        className="space-y-0.5"
                      >
                        {habits.map((habit) => (
                          <motion.div key={habit.id} variants={staggerItem}>
                            <div
                              className={cn(
                                "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/30 border border-transparent",
                                "hover:border-border/20 transition-all duration-150",
                              )}
                            >
                              <span className="flex-1 text-[13px] font-medium leading-none truncate">
                                {habit.text}
                              </span>
                              <FrequencyBadge
                                frequency={habit.frequency as Frequency}
                                weekDays={habit.week_days ?? []}
                                monthDays={habit.month_days ?? []}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteHabit.mutate(habit.id)}
                                className="size-6 rounded-lg text-muted-foreground/20 hover:text-destructive hover:bg-destructive/8 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
