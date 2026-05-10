"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Target, X, Zap } from "lucide-react";
import React from "react";
import {
  EASE_OUT,
  staggerContainer,
  staggerItem,
} from "@/components/daily/full-calendar/animations";
import { Button } from "@/components/ui/button";
import { useDailyStats } from "@/hooks/use-daily";

const STAT_ICONS = {
  completion: CheckCircle2,
  streak: Zap,
  focus: Target,
  logs: Calendar,
};

interface InsightsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsightsModal({ isOpen, onOpenChange }: InsightsModalProps) {
  const { data, isLoading } = useDailyStats();

  if (!isOpen) return null;

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
        style={{ width: "40vw", height: "80vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center">
              <Zap className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold leading-none">Insights</h2>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                How your days add up
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
          <div className="px-5 py-4 space-y-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="size-6 border-2 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-2 gap-2.5"
                >
                  {stats.map((stat) => {
                    const Icon =
                      STAT_ICONS[stat.icon as keyof typeof STAT_ICONS];
                    return (
                      <motion.div key={stat.label} variants={staggerItem}>
                        <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-muted/40 border border-border/5">
                          <div className="flex items-center justify-between">
                            <Icon className="size-3.5 text-muted-foreground/40" />
                            <span className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-wider">
                              {stat.sub}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[22px] font-bold tracking-tight leading-none">
                              {stat.value}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-medium">
                              {stat.label}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Weekly Chart */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-foreground">
                      This week
                    </p>
                    {s?.streak !== undefined && s.streak > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                        <Zap className="size-3" />
                        {s.streak} day streak
                      </span>
                    )}
                  </div>
                  <div className="h-[100px] flex items-end gap-2 px-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day, i) => {
                        const dayData = weeklyData[i];
                        const pct = dayData?.tasks ?? 0;
                        return (
                          <div
                            key={day}
                            className="flex-1 flex flex-col items-center gap-1.5"
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
                            <span className="text-[9px] font-bold text-muted-foreground/30">
                              {day}
                            </span>
                          </div>
                        );
                      },
                    )}
                    {weeklyData.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground/25 font-medium">
                          Not enough data yet
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
