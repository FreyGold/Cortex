"use client";

import React, { useState } from "react";
import { Target, Plus, Search, CheckCircle2, Circle, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function DailyHabits() {
  const [habits, setHabits] = useState([
    { id: "1", text: "Morning Meditation", completed: true, frequency: "Daily" },
    { id: "2", text: "Read 20 pages", completed: false, frequency: "Daily" },
    { id: "3", text: "Gym / Exercise", completed: true, frequency: "Weekdays" },
    { id: "4", text: "Review Course Notes", completed: false, frequency: "Daily" },
  ]);
  const [newHabit, setNewHabit] = useState("");

  const toggleHabit = (id: string) => {
    setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-background/50">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold tracking-tight">Habit Tracking</h2>
            <p className="text-muted-foreground text-sm">Define recurring routines to stay consistent with your goals.</p>
          </div>
          <Card className="border-border/5 bg-card/50 backdrop-blur-sm px-4 py-2">
             <div className="flex items-center gap-3">
                <div className="text-right">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Total Habits</p>
                   <p className="text-xl font-bold tracking-tight">{habits.length}</p>
                </div>
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                   <Target className="size-5 text-primary" />
                </div>
             </div>
          </Card>
        </div>

        {/* Add Habit */}
        <div className="relative">
          <Input 
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Add a new daily habit or routine..."
            className="h-14 pl-12 pr-32 bg-card/50 border-border/5 rounded-2xl shadow-sm text-lg focus-visible:ring-primary/20"
          />
          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30" />
          <Button 
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-6 font-bold text-[11px] uppercase tracking-widest"
            onClick={() => {
               if (newHabit.trim()) {
                  setHabits([...habits, { id: Date.now().toString(), text: newHabit, completed: false, frequency: "Daily" }]);
                  setNewHabit("");
               }
            }}
          >
            Create Habit
          </Button>
        </div>

        {/* Habits List */}
        <div className="grid gap-3">
           {habits.map((habit) => (
             <Card key={habit.id} className="group border-border/5 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-border/10 transition-all shadow-sm">
               <CardContent className="p-4 flex items-center gap-4">
                  <button 
                    onClick={() => toggleHabit(habit.id)}
                    className="focus:outline-none"
                  >
                    {habit.completed ? (
                      <CheckCircle2 className="size-6 text-emerald-500 fill-emerald-500/10" />
                    ) : (
                      <Circle className="size-6 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                     <p className={cn(
                       "font-medium tracking-tight truncate",
                       habit.completed && "text-muted-foreground/40 line-through"
                     )}>
                       {habit.text}
                     </p>
                     <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1 px-1.5 font-bold text-muted-foreground/40 border-muted-foreground/10">
                           {habit.frequency}
                        </Badge>
                     </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteHabit(habit.id)}
                    className="size-9 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="size-4" />
                  </Button>
               </CardContent>
             </Card>
           ))}
        </div>
      </div>
    </div>
  );
}
