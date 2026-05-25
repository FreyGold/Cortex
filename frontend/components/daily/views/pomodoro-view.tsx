"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Square,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Zap,
  Target,
  Coffee,
  SkipForward,
  Settings2
} from "lucide-react";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EASE_OUT, staggerContainer, staggerItem } from "@/components/daily/full-calendar/animations";
import { useDailyStats, useLogPomodoroSession, usePomodoroSessions, useUserSubjects, useCreateSubject, useDeleteSubject } from "@/hooks/use-daily";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type TimerMode = "Focus" | "Short Break" | "Long Break";

const DEFAULT_MODES: Record<TimerMode, number> = {
  "Focus": 25,
  "Short Break": 5,
  "Long Break": 15,
};

export function PomodoroView() {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: statsData, isLoading: isStatsLoading } = useDailyStats();
  const { data: sessionData, isLoading: isSessionsLoading } = usePomodoroSessions(todayStr);
  const { data: subjectsData, isLoading: isSubjectsLoading } = useUserSubjects();
  
  const logSession = useLogPomodoroSession();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  // State
  const [customModes, setCustomModes] = useState<Record<TimerMode, number>>(DEFAULT_MODES);
  const [mode, setMode] = useState<TimerMode>("Focus");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_MODES["Focus"] * 60);
  const [isActive, setIsActive] = useState(false);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Background Web Worker Ref
  const workerRef = useRef<Worker | null>(null);
  const [tick, setTick] = useState(0);

  const sessions = sessionData?.sessions || [];
  const subjects = subjectsData?.subjects || [];
  const isLoading = isStatsLoading || isSessionsLoading || isSubjectsLoading;

  const timeBySubject = useMemo(() => {
    const times: Record<string, number> = {};
    sessions.forEach((s: any) => {
      if (s.subject_id && s.actual_duration_seconds) {
        times[s.subject_id] = (times[s.subject_id] || 0) + s.actual_duration_seconds;
      } else if (s.subject_id && s.duration) {
        times[s.subject_id] = (times[s.subject_id] || 0) + (s.duration * 60);
      }
    });
    return times;
  }, [sessions]);

  // Initialize Notifications and Web Worker
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const code = `
      let timer;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          timer = setInterval(() => self.postMessage('tick'), 1000);
        } else if (e.data === 'stop') {
          clearInterval(timer);
        }
      };
    `;
    const blob = new Blob([code], { type: "application/javascript" });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = () => {
      setTick(t => t + 1);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const notifyComplete = useCallback((completedMode: TimerMode) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(completedMode === "Focus" ? "Focus Session Complete!" : "Break Over!", {
        body: completedMode === "Focus" ? "Great job. Time for a short break." : "Ready to focus again?",
      });
    }
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play();
    } catch (e) {}
  }, []);

  // Main Timer Logic (runs on every tick from Web Worker)
  useEffect(() => {
    if (!isActive || !targetEndTime) return;
    
    const now = Date.now();
    const remaining = Math.max(0, Math.round((targetEndTime - now) / 1000));
    setTimeLeft(remaining);
    
    if (remaining === 0) {
      handleStopAndLog(true);
    }
  }, [tick, isActive, targetEndTime]);

  const handleStopAndLog = async (isAutoComplete = false) => {
    workerRef.current?.postMessage('stop');
    setIsActive(false);

    if (sessionStartTime) {
      const plannedDuration = customModes[mode];
      const actualDurationSeconds = (customModes[mode] * 60) - timeLeft;
      const endTime = new Date();
      
      // Only log Focus sessions longer than 15 seconds
      if (mode === "Focus" && actualDurationSeconds > 15) { 
        try {
          await logSession.mutateAsync({ 
            duration: plannedDuration,
            actualDurationSeconds,
            type: mode,
            startTime: sessionStartTime.toISOString(),
            endTime: endTime.toISOString(),
            subjectId: activeSubjectId || undefined
          });
        } catch (e) {
          console.error("Failed to log session", e);
        }
      }
    }
    
    setSessionStartTime(null);

    if (isAutoComplete) {
      notifyComplete(mode);
      // Auto transition
      if (mode === "Focus") {
        setMode("Short Break");
        setTimeLeft(customModes["Short Break"] * 60);
        setActiveSubjectId(null);
      } else {
        setMode("Focus");
        setTimeLeft(customModes["Focus"] * 60);
      }
    } else {
      setTimeLeft(customModes[mode] * 60);
    }
    setTargetEndTime(null);
  };

  const startTimer = () => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    // Auto-select the most recent subject if none is selected in Focus mode
    if (mode === "Focus" && !activeSubjectId && subjects.length > 0) {
      setActiveSubjectId(subjects[0].id);
    }

    setTargetEndTime(Date.now() + timeLeft * 1000);
    setSessionStartTime(new Date());
    setIsActive(true);
    workerRef.current?.postMessage('start');
  };

  const stopTimer = async () => {
    await handleStopAndLog(false);
  };

  const toggleSubject = async (subjectId: string) => {
    if (activeSubjectId === subjectId && isActive) {
      await stopTimer();
      return;
    }

    if (isActive) {
      await stopTimer();
    }

    setActiveSubjectId(subjectId);
    setMode("Focus");
    setTimeLeft(customModes["Focus"] * 60);
    setTargetEndTime(Date.now() + (customModes["Focus"] * 60) * 1000);
    setSessionStartTime(new Date());
    setIsActive(true);
    workerRef.current?.postMessage('start');
  };

  const skipToBreak = async (breakType: "Short Break" | "Long Break") => {
    if (isActive) await stopTimer();
    setMode(breakType);
    setTimeLeft(customModes[breakType] * 60);
    setActiveSubjectId(null);
  };

  const skipToFocus = async () => {
    if (isActive) await stopTimer();
    setMode("Focus");
    setTimeLeft(customModes["Focus"] * 60);
    
    // Auto-select the most recent subject if none is selected
    if (!activeSubjectId && subjects.length > 0) {
      setActiveSubjectId(subjects[0].id);
    }
  };

  const handleSaveSettings = (newModes: Record<TimerMode, number>) => {
    setCustomModes(newModes);
    localStorage.setItem("pomodoroModes", JSON.stringify(newModes));
    if (!isActive) {
      setTimeLeft(newModes[mode] * 60);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      setIsAddingSubject(false);
      return;
    }
    await createSubject.mutateAsync({ name: newSubjectName.trim() });
    setNewSubjectName("");
    setIsAddingSubject(false);
  };

  const activeSubject = subjects.find((s: any) => s.id === activeSubjectId);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isBreak = mode === "Short Break" || mode === "Long Break";

  return (
    <div className="flex-1 flex w-full h-full bg-background overflow-hidden relative selection:bg-primary/20">
      
      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center pt-24 pb-32">
        <div className="w-full max-w-lg px-8 flex flex-col items-center">
          
          {/* Dynamic Contextual Header (Replaces Tabs) */}
          <div className="h-10 mb-8 flex items-center justify-center w-full relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:text-foreground">
                    <Settings2 className="size-4.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-4 space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold tracking-tight">Timer Settings</h4>
                    <p className="text-[11px] text-muted-foreground font-medium">Adjust durations in minutes.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 items-center gap-3">
                      <Label htmlFor="focus-time" className="col-span-2 text-xs font-semibold text-muted-foreground">Focus</Label>
                      <Input 
                        id="focus-time" 
                        type="number" 
                        min={1} 
                        max={120} 
                        className="col-span-2 h-8 text-xs font-bold" 
                        value={customModes["Focus"]} 
                        onChange={(e) => handleSaveSettings({ ...customModes, "Focus": parseInt(e.target.value) || 25 })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                      <Label htmlFor="short-break" className="col-span-2 text-xs font-semibold text-muted-foreground">Short Break</Label>
                      <Input 
                        id="short-break" 
                        type="number" 
                        min={1} 
                        max={60} 
                        className="col-span-2 h-8 text-xs font-bold" 
                        value={customModes["Short Break"]} 
                        onChange={(e) => handleSaveSettings({ ...customModes, "Short Break": parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                      <Label htmlFor="long-break" className="col-span-2 text-xs font-semibold text-muted-foreground">Long Break</Label>
                      <Input 
                        id="long-break" 
                        type="number" 
                        min={1} 
                        max={60} 
                        className="col-span-2 h-8 text-xs font-bold" 
                        value={customModes["Long Break"]} 
                        onChange={(e) => handleSaveSettings({ ...customModes, "Long Break": parseInt(e.target.value) || 15 })}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <AnimatePresence mode="wait">
              {isBreak ? (
                <motion.div
                  key="break"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                >
                  <Coffee className="size-4" />
                  <span className="text-sm font-bold tracking-tight">{mode}</span>
                  {!isActive && (
                    <div className="flex gap-2 ml-4 pl-4 border-l border-emerald-500/20">
                      <button onClick={() => skipToBreak(mode === "Short Break" ? "Long Break" : "Short Break")} className="text-xs hover:underline opacity-70 hover:opacity-100">
                        Switch to {mode === "Short Break" ? "Long Break" : "Short Break"}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : activeSubject && isActive ? (
                <motion.div 
                  key="focus-active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  <Target className="size-4" />
                  <span className="text-sm font-bold tracking-tight">Focusing on {activeSubject.name}</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="focus-idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-1.5"
                >
                  <span className="text-sm font-bold tracking-tight text-muted-foreground">Select a subject to start focusing</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Huge Dynamic Timer */}
          <div className="flex flex-col items-center justify-center mb-16 w-full">
            <span 
              className={cn(
                "text-[8rem] sm:text-[10rem] font-medium tracking-[-0.05em] leading-none transition-colors duration-500 ease-out text-center",
                isActive ? (isBreak ? "text-emerald-500" : "text-foreground") : "text-muted-foreground/30"
              )}
              style={{ 
                fontVariantNumeric: "tabular-nums",
                minWidth: "4.5ch" /* Locks width for up to 100+ minutes without layout shift */
              }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>

            {/* Contextual Play/Stop Controls */}
            <div className="mt-12 flex items-center justify-center gap-6">
              {isActive ? (
                <button
                  onClick={stopTimer}
                  className={cn(
                    "flex items-center justify-center size-20 rounded-full shadow-lg transition-transform active:scale-95",
                    isBreak ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  <Square className="size-8 fill-current" />
                </button>
              ) : (
                <button
                  onClick={startTimer}
                  className={cn(
                    "flex items-center justify-center size-20 rounded-full shadow-lg transition-transform active:scale-95",
                    isBreak ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  <Play className="size-8 fill-current ml-1" />
                </button>
              )}

              {/* Fast Forward / Skip */}
              <button
                onClick={() => isBreak ? skipToFocus() : skipToBreak("Short Break")}
                className="flex items-center justify-center size-12 rounded-full bg-background border border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95"
              >
                <SkipForward className="size-5" />
              </button>
            </div>
          </div>

          {/* Subject List */}
          <div className="w-full flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-bold text-foreground">Subjects</h3>
              <span className="text-xs font-medium text-muted-foreground">Today's Focus</span>
            </div>

            <div className="flex flex-col gap-1">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />
                ))
              ) : (
                <AnimatePresence initial={false}>
                  {subjects.map((subject: any) => {
                    const isSubjectActive = activeSubjectId === subject.id && isActive;
                    const totalSeconds = timeBySubject[subject.id] || 0;
                    const hrs = Math.floor(totalSeconds / 3600);
                    const mins = Math.floor((totalSeconds % 3600) / 60);

                    return (
                      <motion.div
                        layout="position"
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className={cn(
                          "group relative flex items-center justify-between p-3 rounded-2xl transition-all duration-200 ease-out",
                          isSubjectActive 
                            ? "bg-primary/5 border border-primary/20 shadow-sm" 
                            : "bg-transparent border border-transparent hover:bg-muted/40 hover:border-border/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSubject(subject.id)}
                            className={cn(
                              "size-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                              isSubjectActive 
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                                : "bg-background border border-border/60 text-foreground group-hover:border-foreground/20 group-hover:bg-foreground group-hover:text-background"
                            )}
                          >
                            {isSubjectActive ? (
                              <Square className="size-3.5 fill-current" />
                            ) : (
                              <Play className="size-3.5 fill-current ml-0.5" />
                            )}
                          </button>
                          <span className={cn(
                            "text-sm font-semibold transition-colors",
                            isSubjectActive ? "text-primary" : "text-foreground"
                          )}>
                            {subject.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "text-xs font-medium tabular-nums transition-colors",
                            isSubjectActive ? "text-primary/70" : "text-muted-foreground"
                          )}>
                            {hrs > 0 ? `${hrs}h ` : ''}{mins}m
                          </span>
                          
                          <button 
                            onClick={() => deleteSubject.mutate(subject.id)}
                            className="size-7 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

              {/* Add Subject Inline Form */}
              {isAddingSubject ? (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddSubject}
                  className="flex items-center gap-2 p-2 mt-2 bg-background border border-border/60 rounded-xl shadow-sm overflow-hidden"
                >
                  <Input 
                    ref={inputRef}
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Subject name..."
                    className="flex-1 h-8 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium px-2"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setIsAddingSubject(false);
                    }}
                  />
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs px-3 hover:bg-muted" onClick={() => setIsAddingSubject(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="h-8 text-xs px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-all">Add</Button>
                </motion.form>
              ) : (
                <button
                  onClick={() => {
                    setIsAddingSubject(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="mt-2 flex items-center gap-2 p-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group w-full text-left rounded-xl hover:bg-muted/30"
                >
                  <div className="size-8 rounded-full border border-dashed border-border/60 flex items-center justify-center group-hover:border-foreground/30 transition-colors">
                    <Plus className="size-4" />
                  </div>
                  <span>Add new subject...</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Right Side: Session Log Timeline */}
      <div className="w-[380px] shrink-0 border-l border-border/10 bg-muted/10 h-full flex flex-col">
        <div className="p-6 border-b border-border/10">
          <h3 className="text-sm font-bold tracking-tight">Today's Log</h3>
          <p className="text-xs text-muted-foreground mt-1">Exact time records</p>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="space-y-0 relative">
            {sessions.length > 0 && (
              <div className="absolute left-[15px] top-6 bottom-6 w-[1.5px] bg-border/40" />
            )}
            
            {sessions.map((session: any) => {
              const start = new Date(session.start_time);
              const end = session.end_time ? new Date(session.end_time) : new Date(start.getTime() + (session.actual_duration_seconds || session.duration * 60) * 1000);
              
              const timeFormat = { hour: 'numeric', minute: '2-digit' } as const;
              const timeStr = `${start.toLocaleTimeString([], timeFormat)} - ${end.toLocaleTimeString([], timeFormat)}`;
              const actualMins = session.actual_duration_seconds ? Math.round(session.actual_duration_seconds / 60) : session.duration;
              
              const subj = session.subject?.name || session.type;
              const isDeepWork = session.type === "Focus" || session.type === "Deep Work";

              return (
                <div key={session.id} className="flex gap-4 pb-6 relative z-10 group">
                  <div className="flex flex-col items-center mt-1">
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center shadow-sm border",
                      isDeepWork ? "bg-background border-primary/20 text-primary" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                    )}>
                      {isDeepWork ? <Target className="size-3.5" /> : <Coffee className="size-3.5" />}
                    </div>
                  </div>
                  <div className="flex-1 bg-background border border-border/40 rounded-xl p-3 shadow-sm group-hover:border-border/80 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold">{subj}</span>
                      <span className="text-xs font-bold text-muted-foreground">{actualMins}m</span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground/70 font-medium">
                      {timeStr}
                    </div>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && !isLoading && (
               <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Clock className="size-6 text-muted-foreground/30 mb-3" />
                  <p className="text-xs font-medium text-muted-foreground">No sessions recorded today.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
