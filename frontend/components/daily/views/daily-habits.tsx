"use client";

import React, { useState } from "react";
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useHabits,
  useCreateHabit,
  useDeleteHabit,
  useHabitLogs,
  useToggleHabitLog,
} from "@/hooks/use-daily";
import { format } from "date-fns";
import type { HabitItem } from "@/lib/api/daily";

const FREQUENCIES: HabitItem["frequency"][] = [
  "Daily",
  "Weekdays",
  "Weekends",
  "Custom",
];

const FREQUENCY_COLORS: Record<HabitItem["frequency"], string> = {
  Daily: "text-primary border-primary/20 bg-primary/5",
  Weekdays: "text-blue-500 border-blue-500/20 bg-blue-500/5",
  Weekends: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
  Custom: "text-amber-500 border-amber-500/20 bg-amber-500/5",
};

export function DailyHabits() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: habitsData, isLoading: habitsLoading } = useHabits();
  const { data: logsData, isLoading: logsLoading } = useHabitLogs(today, today);
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const toggleLog = useToggleHabitLog();

  const [newHabit, setNewHabit] = useState("");
  const [newFrequency, setNewFrequency] = useState<HabitItem["frequency"]>("Daily");

  const habits = habitsData?.habits ?? [];
  const todayLogs = logsData?.logs ?? [];

  const isCompleted = (habitId: string) =>
    todayLogs.some((l) => l.habit_id === habitId && l.completed);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.trim() || createHabit.isPending) return;
    createHabit.mutate(
      { text: newHabit.trim(), frequency: newFrequency },
      { onSuccess: () => setNewHabit("") }
    );
  };

  const handleToggle = (habitId: string) => {
    const current = isCompleted(habitId);
    toggleLog.mutate({ habitId, date: today, completed: !current });
  };

  const completedCount = habits.filter((h) => isCompleted(h.id)).length;
  const isLoading = habitsLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-background/50">
        <Loader2 className="size-8 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-background/50">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Habit Tracking</h2>
            <p className="text-muted-foreground text-sm">
              Define recurring routines and track today's completions.
            </p>
          </div>

          {habits.length > 0 && (
            <Card className="border-border/5 bg-card/50 backdrop-blur-sm px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    Today
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {completedCount}
                    <span className="text-muted-foreground/30 text-sm font-medium">
                      /{habits.length}
                    </span>
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="size-5 text-primary" />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Add Habit */}
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 pointer-events-none" />
            <Input
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Add a new habit or routine..."
              className="h-12 pl-11 pr-4 bg-card/50 border-border/5 rounded-2xl shadow-sm focus-visible:ring-primary/20"
              disabled={createHabit.isPending}
            />
          </div>
          <Select
            value={newFrequency}
            onValueChange={(v) => setNewFrequency(v as HabitItem["frequency"])}
          >
            <SelectTrigger className="h-12 w-[130px] rounded-2xl bg-card/50 border-border/5 text-[12px] font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {FREQUENCIES.map((f) => (
                <SelectItem key={f} value={f} className="text-[13px]">
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="submit"
            disabled={!newHabit.trim() || createHabit.isPending}
            className="h-12 px-6 rounded-2xl font-bold text-[11px] uppercase tracking-widest"
          >
            {createHabit.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        </form>

        {/* Habits List */}
        {habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Target className="size-7 text-muted-foreground/30" />
            </div>
            <h3 className="font-bold text-base mb-1">No habits yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Add your first habit above to start tracking your daily routines.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {habits.map((habit) => {
              const done = isCompleted(habit.id);
              const isToggling = toggleLog.isPending;

              return (
                <Card
                  key={habit.id}
                  className={cn(
                    "group border-border/5 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border/10 transition-all shadow-sm",
                    done && "opacity-75"
                  )}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <button
                      onClick={() => handleToggle(habit.id)}
                      disabled={isToggling}
                      className="focus:outline-none shrink-0 transition-transform active:scale-90"
                    >
                      {done ? (
                        <CheckCircle2 className="size-6 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Circle className="size-6 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-medium tracking-tight truncate",
                          done && "text-muted-foreground/40 line-through"
                        )}
                      >
                        {habit.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase tracking-tighter h-4 px-1.5 font-bold border",
                            FREQUENCY_COLORS[habit.frequency]
                          )}
                        >
                          {habit.frequency}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit.mutate(habit.id)}
                      disabled={deleteHabit.isPending}
                      className="size-9 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        {habits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              <span>Today's Progress</span>
              <span>
                {completedCount}/{habits.length} Complete
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{
                  width: `${habits.length > 0 ? (completedCount / habits.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
