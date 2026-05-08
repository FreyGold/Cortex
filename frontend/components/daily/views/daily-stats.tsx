"use client";

import React from "react";
import { TrendingUp, Target, Zap, Award, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useDailyStats } from "@/hooks/use-daily";
import { cn } from "@/lib/utils";

export function DailyStats() {
  const { data, isLoading } = useDailyStats();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-background/50">
        <Loader2 className="size-8 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  const s = data?.stats;

  const stats = [
    { label: "Completion Rate", value: `${s?.completionRate || 0}%`, change: "Overall", icon: CheckCircle2, color: "text-emerald-500" },
    { label: "Current Streak", value: s?.streak || 0, change: "Days", icon: Zap, color: "text-amber-500" },
    { label: "Focus Score", value: `${s?.focusScore || 0}%`, change: "Productivity", icon: Target, color: "text-primary" },
    { label: "Total Logs", value: s?.totalLogs || 0, change: "History", icon: Calendar, color: "text-blue-500" },
  ];

  const weeklyData = s?.weeklyData || [];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-background/50 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Progress & Insights</h2>
          <p className="text-muted-foreground text-sm font-medium">Live data aggregated from your daily track activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-border/5 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl bg-background border border-border/5 shadow-sm", stat.color)}>
                    <stat.icon className="size-5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/5 text-emerald-600 border-none px-2">
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Chart */}
          <Card className="lg:col-span-2 border-border/5 bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <TrendingUp className="size-4" /> Weekly Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-end justify-between px-12 pb-12 gap-4">
              {weeklyData.map((data: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-default">
                  <div className="w-full relative flex flex-col justify-end h-[180px]">
                     <div 
                       className="w-full bg-primary/10 group-hover:bg-primary/20 transition-all rounded-t-xl relative border-t-2 border-primary/20"
                       style={{ height: `${data.tasks}%` }}
                     >
                        <div className="absolute inset-x-0 -top-7 text-[10px] font-bold text-center opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 text-primary">
                           {data.tasks}%
                        </div>
                     </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">{data.day}</span>
                </div>
              ))}
              {weeklyData.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20 text-xs font-bold uppercase tracking-widest">
                  Not enough data for weekly trends
                </div>
              )}
            </CardContent>
          </Card>

          {/* Achievement / Next Target */}
          <Card className="border-border/5 bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-8 pt-8">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Award className="size-4" /> Growth Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
               <div className="flex flex-col items-center text-center space-y-4">
                  <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20">
                     <TrendingUp className="size-8 text-primary/40" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold">Consistency Master</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">Complete all tasks for 10 days in a row to level up.</p>
                  </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                     <span>Streak Progress</span>
                     <span>{s?.streak || 0}/10 Days</span>
                  </div>
                  <Progress value={((s?.streak || 0) / 10) * 100} className="h-2 rounded-full" />
               </div>

               <Button className="w-full font-bold uppercase tracking-widest text-[10px] py-6 rounded-2xl shadow-xl shadow-primary/10 transition-all hover:shadow-primary/20 hover:-translate-y-0.5">
                  View Achievements
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
