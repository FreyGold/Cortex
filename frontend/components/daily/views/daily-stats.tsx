"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Target, Zap } from "lucide-react";
import React from "react";
import {
  EASE_OUT,
  staggerContainer,
  staggerItem,
} from "@/components/daily/full-calendar/animations";
import { useDailyStats } from "@/hooks/use-daily";

const STAT_ICONS = {
  completion: CheckCircle2,
  streak: Zap,
  focus: Target,
  logs: Calendar,
};

export function DailyStats() {
  const { data, isLoading } = useDailyStats();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="size-8 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const s = data?.stats;
  const weeklyData = s?.weeklyData || [];

  const stats = [
    {
      label: "Completion",
      value: `${s?.completionRate ?? 0}%`,
      sub: "task rate",
      icon: "completion",
    },
    { label: "Streak", value: s?.streak ?? 0, sub: "days", icon: "streak" },
    {
      label: "Focus",
      value: `${s?.focusScore ?? 0}%`,
      sub: "score",
      icon: "focus",
    },
    { label: "Logs", value: s?.totalLogs ?? 0, sub: "total", icon: "logs" },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="space-y-1"
        >
          <h2 className="text-[28px] font-bold tracking-tight leading-none">
            Insights
          </h2>
          <p className="text-sm text-muted-foreground leading-none">
            How your days add up.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          {stats.map((stat) => {
            const Icon = STAT_ICONS[stat.icon as keyof typeof STAT_ICONS];
            return (
              <motion.div key={stat.label} variants={staggerItem}>
                <div className="flex flex-col gap-3 p-5 rounded-2xl bg-card border border-border/10">
                  <div className="flex items-center justify-between">
                    <Icon className="size-4 text-muted-foreground/40" />
                    <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                      {stat.sub}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[28px] font-bold tracking-tight leading-none">
                      {stat.value}
                    </p>
                    <p className="text-[12px] text-muted-foreground font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: EASE_OUT }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">
              This week
            </p>
            {s?.streak !== undefined && s.streak > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                <Zap className="size-3" />
                {s.streak} day streak
              </span>
            )}
          </div>
          <div className="h-[120px] flex items-end gap-2 px-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const dayData = weeklyData[i];
              const pct = dayData?.tasks ?? 0;
              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, 4)}%` }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.06,
                      ease: EASE_OUT,
                    }}
                    className="w-full rounded-t-md bg-primary/20 relative group"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.06 + 0.1,
                        ease: EASE_OUT,
                      }}
                      className="absolute bottom-0 inset-x-0 rounded-t-md bg-primary/60 group-hover:bg-primary transition-colors duration-150"
                    />
                  </motion.div>
                  <span className="text-[10px] font-bold text-muted-foreground/30">
                    {day}
                  </span>
                </div>
              );
            })}
            {weeklyData.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[11px] text-muted-foreground/25 font-medium">
                  Not enough data yet
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
