"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Target,
  X,
  Zap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { EASE_OUT } from "@/components/daily/full-calendar/animations";
import { Button } from "@/components/ui/button";
import { useDailyStats } from "@/hooks/use-daily";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";

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
  const [activeTab, setActiveTab] = useState("habits");

  if (!isOpen) return null;

  const s = data?.stats;
  const tasks = s?.tasks || {};
  const habits = s?.habits || {};
  const pomodoro = s?.pomodoro || {};
  const weeklyData = tasks.weeklyData || [];

  const stats = [
    {
      label: "Completion Rate",
      value: `${tasks.completionRate ?? 0}%`,
      icon: "completion",
    },
    { label: "Current Streak", value: `${tasks.streak ?? 0} days`, icon: "streak" },
    {
      label: "Focus Score",
      value: `${pomodoro.focusScore ?? 0}%`,
      icon: "focus",
    },
    { label: "Total Logs", value: tasks.totalLogs ?? 0, icon: "logs" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="fixed inset-0 z-50 bg-background/20 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-2xl shadow-xl overflow-hidden flex flex-col border border-border/5"
        style={{ width: "420px", height: "640px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-base font-bold tracking-tight">Daily Insights</h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              Summary of your academic progress
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-full text-muted-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 pb-2 shrink-0">
            <TabsList className="w-full bg-muted/40 h-10 p-1 rounded-xl">
              <TabsTrigger
                value="habits"
                className="flex-1 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all"
              >
                Habits
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="flex-1 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="focus"
                className="flex-1 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all"
              >
                Focus
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="size-5 border-2 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <Conversation className="h-full">
                <ConversationContent className="p-0 gap-0 h-full">
                  {/* Habits Tab */}
                  <TabsContent value="habits" className="mt-0 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between py-2.5 border-b border-border/5">
                          <span className="text-[12px] text-muted-foreground font-medium">Consistency</span>
                          <span className="text-[13px] font-bold text-foreground">{habits.consistency ?? 0}%</span>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-b border-border/5">
                          <span className="text-[12px] text-muted-foreground font-medium">Longest Streak</span>
                          <span className="text-[13px] font-bold text-foreground">{habits.longestStreak ?? 0} days</span>
                        </div>
                      </div>

                      <Message from="assistant">
                        <MessageContent>
                          <MessageResponse>
                            Your habit consistency is strong in the mornings, but trails off after 8 PM.
                          </MessageResponse>
                        </MessageContent>
                      </Message>
                    </div>
                  </TabsContent>

                  {/* Tasks Tab */}
                  <TabsContent value="tasks" className="mt-0 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                      <div className="space-y-1">
                        {stats.map((stat) => (
                          <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-border/5 last:border-0">
                            <span className="text-[12px] text-muted-foreground font-medium">{stat.label}</span>
                            <span className="text-[13px] font-bold text-foreground">{stat.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Simple Bar Chart */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-end justify-between h-24 gap-2">
                          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => {
                            const pct = weeklyData[i]?.tasks ?? 0;
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-muted/30 rounded-t-sm relative h-full">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${pct}%` }}
                                    className="absolute bottom-0 inset-x-0 bg-primary/40 rounded-t-sm"
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground/30">{day}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Focus Tab */}
                  <TabsContent value="focus" className="mt-0 h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-1">Total Time</p>
                          <p className="text-2xl font-bold tracking-tight">
                            {pomodoro.focusTimeHours ?? 0}h {pomodoro.focusTimeMinutes ?? 0}m
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Sessions</p>
                          <p className="text-2xl font-bold tracking-tight">{pomodoro.totalSessions ?? 0}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
                        <div className="space-y-2">
                          {(pomodoro.recentSessions || []).map((session: any) => (
                            <div key={session.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/5">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[12px] font-bold text-foreground">{session.type}</span>
                                <span className="text-[10px] font-medium text-muted-foreground/60">{session.timestamp}</span>
                              </div>
                              <span className="text-[11px] font-bold text-primary/60">{session.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Message from="assistant">
                        <MessageContent>
                          <MessageResponse>
                            You focus best on Mondays. Your most productive subject this week is Frontend Development.
                          </MessageResponse>
                        </MessageContent>
                      </Message>
                    </div>
                  </TabsContent>
                </ConversationContent>
              </Conversation>
            )}
          </div>
        </Tabs>
      </motion.div>
    </>
  );
}
