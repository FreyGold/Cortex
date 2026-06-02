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
  Settings2,
  Users,
  UserPlus,
  Trophy,
  ArrowLeft,
  Mail,
  Send,
  Check,
  X,
  UserMinus,
  Calendar,
  Loader2,
  Trash2 as Trash,
  MoreVertical,
  Copy,
  Link,
} from "lucide-react";
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EASE_OUT, staggerContainer, staggerItem } from "@/components/daily/full-calendar/animations";
import { useDailyStats, useLogPomodoroSession, usePomodoroSessions, useUserSubjects, useCreateSubject, useDeleteSubject, useGroups, useCreateGroup, useDeleteGroup, useAddGroupMember, useRemoveGroupMember, useFriends, useFriendRequests, useSendFriendRequest, useRespondToFriendRequest, useRemoveFriend, useGroupLeaderboard, useFriendsLeaderboard, useLeaderboard, useUserMonthlyLog, useCreateGroupInvitation, useGetGroupInvitations, useJoinGroupByCode } from "@/hooks/use-daily";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getUserId } from "@/lib/supabase/client";
import { StudyCalendar } from "./study-calendar";

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

  const [subTab, setSubTab] = useState<"log" | "groups" | "friends" | "leaderboard">("log");
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

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

  const totalFocusSecondsToday = useMemo(() => {
    return sessions
      .filter((s: any) => s.type === "Focus" || s.type === "Deep Work")
      .reduce((acc: number, s: any) => acc + (s.actual_duration_seconds || 0), 0);
  }, [sessions]);

  const totalFocusHrs = Math.floor(totalFocusSecondsToday / 3600);
  const totalFocusMins = Math.round((totalFocusSecondsToday % 3600) / 60);

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
    const name = newSubjectName.trim();
    if (!name) {
      setIsAddingSubject(false);
      return;
    }

    // Check for duplicates
    const exists = subjects.some((s: any) => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert("A subject with this name already exists.");
      return;
    }

    await createSubject.mutateAsync({ name });
    setNewSubjectName("");
    setIsAddingSubject(false);
  };

  const activeSubject = subjects.find((s: any) => s.id === activeSubjectId);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isBreak = mode === "Short Break" || mode === "Long Break";

  return (
    <>
    <div className="flex-1 flex w-full h-full bg-background overflow-hidden">
      
      {/* Main Workspace - Timer always visible */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center pt-8">
        <div className="w-full max-w-lg px-8 flex flex-col items-center">
          
          {/* Dynamic Contextual Header */}
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
                        type="number" min={1} max={120} className="col-span-2 h-8 text-xs font-bold" 
                        value={customModes["Focus"]} 
                        onChange={(e) => handleSaveSettings({ ...customModes, "Focus": parseInt(e.target.value) || 25 })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                      <Label htmlFor="short-break" className="col-span-2 text-xs font-semibold text-muted-foreground">Short Break</Label>
                      <Input 
                        id="short-break" type="number" min={1} max={60} className="col-span-2 h-8 text-xs font-bold" 
                        value={customModes["Short Break"]} 
                        onChange={(e) => handleSaveSettings({ ...customModes, "Short Break": parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-3">
                      <Label htmlFor="long-break" className="col-span-2 text-xs font-semibold text-muted-foreground">Long Break</Label>
                      <Input 
                        id="long-break" type="number" min={1} max={60} className="col-span-2 h-8 text-xs font-bold" 
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
                <motion.div key="break" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
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
                <motion.div key="focus-active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  <Target className="size-4" />
                  <span className="text-sm font-bold tracking-tight">Focusing on {activeSubject.name}</span>
                </motion.div>
              ) : (
                <motion.div key="focus-idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-4 py-1.5"
                >
                  <span className="text-sm font-bold tracking-tight text-muted-foreground">Select a subject to start focusing</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Huge Dynamic Timer */}
          <div className="flex flex-col items-center justify-center mb-16 w-full">
            <span className={cn("text-[8rem] sm:text-[10rem] font-medium tracking-[-0.05em] leading-none transition-colors duration-500 ease-out text-center",
                isActive ? (isBreak ? "text-emerald-500" : "text-foreground") : "text-muted-foreground/30"
              )}
              style={{ fontVariantNumeric: "tabular-nums", minWidth: "4.5ch" }}
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>

            <div className="mt-12 flex items-center justify-center gap-6">
              {isActive ? (
                <button onClick={stopTimer} className={cn("flex items-center justify-center size-20 rounded-full shadow-lg transition-transform active:scale-95",
                    isBreak ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-muted text-foreground hover:bg-muted/80"
                  )}>
                  <Square className="size-8 fill-current" />
                </button>
              ) : (
                <button onClick={startTimer} className={cn("flex items-center justify-center size-20 rounded-full shadow-lg transition-transform active:scale-95",
                    isBreak ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}>
                  <Play className="size-8 fill-current ml-1" />
                </button>
              )}
              <button onClick={() => isBreak ? skipToFocus() : skipToBreak("Short Break")}
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
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted/30 animate-pulse" />)
              ) : (
                <AnimatePresence initial={false}>
                  {subjects.map((subject: any) => {
                    const isSubjectActive = activeSubjectId === subject.id && isActive;
                    const totalSeconds = timeBySubject[subject.id] || 0;
                    const hrs = Math.floor(totalSeconds / 3600);
                    const mins = Math.floor((totalSeconds % 3600) / 60);
                    return (
                      <motion.div layout="position" key={subject.id} initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className={cn("group relative flex items-center justify-between p-3 rounded-2xl transition-all duration-200 ease-out",
                          isSubjectActive ? "bg-primary/5 border border-primary/20 shadow-sm" : "bg-transparent border border-transparent hover:bg-muted/40 hover:border-border/40"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleSubject(subject.id)} className={cn(
                              "size-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90",
                              isSubjectActive ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-background border border-border/60 text-foreground group-hover:border-foreground/20 group-hover:bg-foreground group-hover:text-background"
                            )}>
                            {isSubjectActive ? <Square className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current ml-0.5" />}
                          </button>
                          <span className={cn("text-sm font-semibold transition-colors", isSubjectActive ? "text-primary" : "text-foreground")}>{subject.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn("text-xs font-medium tabular-nums transition-colors", isSubjectActive ? "text-primary/70" : "text-muted-foreground")}>
                            {hrs > 0 ? `${hrs}h ` : ''}{mins}m
                          </span>
                          <button onClick={() => deleteSubject.mutate(subject.id)}
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
              {isAddingSubject ? (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddSubject} className="flex items-center gap-2 p-2 mt-2 bg-background border border-border/60 rounded-xl shadow-sm overflow-hidden"
                >
                  <Input ref={inputRef} value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder="Subject name..." className="flex-1 h-8 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm font-medium px-2"
                    onKeyDown={(e) => { if (e.key === "Escape") setIsAddingSubject(false); }}
                  />
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs px-3 hover:bg-muted" onClick={() => setIsAddingSubject(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="h-8 text-xs px-4 rounded-lg bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-all">Add</Button>
                </motion.form>
              ) : (
                <button onClick={() => { setIsAddingSubject(true); setTimeout(() => inputRef.current?.focus(), 50); }}
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

      {/* Right Side: Sub-tabbed panel (Log / Groups / Friends) */}
      <div className="w-[380px] shrink-0 border-l border-border/10 bg-muted/5 h-full flex flex-col">
        <div className="shrink-0 flex justify-center pt-3 pb-2 px-4 border-b border-border/10">
          <Tabs value={subTab} onValueChange={(v) => setSubTab(v as typeof subTab)}>
            <TabsList className="h-8 bg-muted/30 p-0.5 rounded-full">
              <TabsTrigger value="log" className="px-3 rounded-full gap-1 text-[11px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Clock className="size-3" />
                Log
              </TabsTrigger>
              <TabsTrigger value="groups" className="px-3 rounded-full gap-1 text-[11px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Users className="size-3" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="friends" className="px-3 rounded-full gap-1 text-[11px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <UserPlus className="size-3" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="px-3 rounded-full gap-1 text-[11px] font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Trophy className="size-3" />
                Board
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {subTab === "log" && (
          <>
            <div className="shrink-0 p-6 pb-4 border-b border-border/10 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold tracking-tight">Today's Log</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-1">Exact time records</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-bold tracking-tight tabular-nums">
                  {totalFocusHrs > 0 ? `${totalFocusHrs}h ` : ''}{totalFocusMins}m
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Total Focus</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-0 relative">
                {sessions.length > 0 && <div className="absolute left-[17.5px] top-8 bottom-8 w-[1.5px] bg-border/20" />}
                {sessions.map((session: any) => {
                  const start = new Date(session.start_time);
                  const end = session.end_time ? new Date(session.end_time) : new Date(start.getTime() + (session.actual_duration_seconds || session.duration * 60) * 1000);
                  const timeFormat = { hour: 'numeric', minute: '2-digit' } as const;
                  const timeStr = `${start.toLocaleTimeString([], timeFormat)} - ${end.toLocaleTimeString([], timeFormat)}`;
                  const actualMins = session.actual_duration_seconds ? Math.round(session.actual_duration_seconds / 60) : session.duration;
                  const subj = session.subject?.name || session.type;
                  const isDeepWork = session.type === "Focus" || session.type === "Deep Work";
                  return (
                    <div key={session.id} className="flex gap-4 pb-8 relative z-10 group">
                      <div className="flex flex-col items-center mt-1.5">
                        <div className={cn("size-9 rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 group-hover:scale-110",
                            isDeepWork ? "bg-background border-primary/20 text-primary shadow-primary/5" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-emerald-500/5"
                          )}>
                          {isDeepWork ? <Target className="size-4" /> : <Coffee className="size-4" />}
                        </div>
                      </div>
                      <div className="flex-1 bg-background border border-border/40 rounded-[20px] p-4 shadow-sm group-hover:border-primary/20 group-hover:shadow-md transition-all duration-300">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-sm font-bold tracking-tight">{subj}</span>
                          <span className="text-[11px] font-bold tabular-nums text-muted-foreground/60">{actualMins}m</span>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                          <Clock className="size-3 mr-1.5 opacity-50" />
                          {timeStr}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
      {subTab === "groups" && <GroupsPanel onUserClick={(id, name) => setSelectedUser({ id, name })} />}
      {subTab === "friends" && <FriendsPanel onUserClick={(id, name) => setSelectedUser({ id, name })} />}
      {subTab === "leaderboard" && <LeaderboardPanel onUserClick={(id, name) => setSelectedUser({ id, name })} />}
    </div>
  </div>

      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-[95vw] max-w-[95vw] w-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser?.name || "User"}'s Study Calendar</DialogTitle>
          </DialogHeader>
          <div className="px-[0.5vw]">
            {selectedUser && <StudyCalendar userId={selectedUser.id} userName={selectedUser.name} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Leaderboard Panel ──────────────────────────────────────

function LeaderboardPanel({ onUserClick }: { onUserClick?: (id: string, name: string) => void }) {
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];

  const [scope, setScope] = useState<"global" | "friends" | string>("global");

  const { data: globalData } = useLeaderboard();
  const { data: friendsData } = useFriendsLeaderboard();
  const { data: groupData } = useGroupLeaderboard(
    scope !== "global" && scope !== "friends" ? scope : null
  );

  let leaderboard: any[] = [];
  let title = "Today's Leaderboard";
  if (scope === "global") {
    leaderboard = globalData?.leaderboard || [];
    title = "Global Leaderboard";
  } else if (scope === "friends") {
    leaderboard = friendsData?.leaderboard || [];
    title = "Friends Leaderboard";
  } else {
    leaderboard = groupData?.leaderboard || [];
    const g = groups.find((g) => g.id === scope);
    title = g ? `${g.name} Leaderboard` : "Group Leaderboard";
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select scope..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">🌍 Global</SelectItem>
            <SelectItem value="friends">👥 Friends</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>👤 {g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <Trophy className="size-3.5" />
        {title}
      </h3>

      {leaderboard.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 py-4">No focus sessions today.</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry: any, i: number) => {
            const hours = Math.floor(entry.total_seconds / 3600);
            const mins = Math.floor((entry.total_seconds % 3600) / 60);
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={entry.user_id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                  <button onClick={() => onUserClick?.(entry.user_id, entry.name || entry.email)} className="text-sm font-medium hover:text-primary transition-colors text-left">
                    {entry.name || entry.email}
                  </button>
                </div>
                <span className="text-xs font-bold tabular-nums text-muted-foreground">{hours > 0 ? `${hours}h ` : ""}{mins}m</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Groups Panel ──────────────────────────────────────────

function GroupsPanel({ onUserClick }: { onUserClick?: (id: string, name: string) => void }) {
  const { data: groupsData, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const deleteGroup = useDeleteGroup();
  const removeMember = useRemoveGroupMember();
  const createInvitation = useCreateGroupInvitation();
  const joinByCode = useJoinGroupByCode();

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const groups = groupsData?.groups || [];
  const selectedGroupData = groups.find((g) => g.id === selectedGroup);
  const { data: leaderboardData } = useGroupLeaderboard(selectedGroup);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await createGroup.mutateAsync({ name: newGroupName.trim(), description: newGroupDesc.trim() || undefined });
    setNewGroupName("");
    setNewGroupDesc("");
    setIsAdding(false);
  };

  const handleInvite = async (groupId: string) => {
    if (!inviteEmail.trim()) return;
    try {
      await createInvitation.mutateAsync({ groupId, email: inviteEmail.trim() });
      setInviteEmail("");
      setShowInvite(false);
    } catch {}
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinByCode.mutateAsync(joinCode.trim());
      setJoinCode("");
      setIsJoining(false);
    } catch {}
  };

  const handleCopyCode = () => {
    if (selectedGroupData?.invite_code) {
      navigator.clipboard.writeText(selectedGroupData.invite_code);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  if (selectedGroup && selectedGroupData) {
    const leaderboard = leaderboardData?.leaderboard || [];
    return (
      <>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-4" />
              Back
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-full">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setShowInvite(true)}>
                  <UserPlus className="size-3.5 mr-2" />
                  Invite
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShare(true)}>
                  <Link className="size-3.5 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowMembers(true)}>
                  <Users className="size-3.5 mr-2" />
                  Members
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteGroup.mutate(selectedGroup)} className="text-destructive focus:text-destructive">
                  <Trash className="size-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">{selectedGroupData.name}</h2>
            {selectedGroupData.description && (
              <p className="text-sm text-muted-foreground mt-1">{selectedGroupData.description}</p>
            )}
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="size-3.5" />
            Today's Leaderboard
          </h3>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 py-4 text-center">No focus sessions from group members today.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => {
                const hours = Math.floor(entry.total_seconds / 3600);
                const mins = Math.floor((entry.total_seconds % 3600) / 60);
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div key={entry.user_id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                      <button onClick={() => onUserClick?.(entry.user_id, entry.name || entry.email)} className="text-sm font-medium hover:text-primary transition-colors text-left">
                        {entry.name || entry.email}
                      </button>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-muted-foreground">{hours > 0 ? `${hours}h ` : ""}{mins}m</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite to {selectedGroupData.name}</DialogTitle>
              <DialogDescription>The invited user will need to accept the invitation.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address..."
                className="h-9 text-sm flex-1"
                type="email"
              />
              <Button size="sm" onClick={() => handleInvite(selectedGroup)} className="h-9 shrink-0" disabled={!inviteEmail.trim()}>
                <Send className="size-3.5 mr-1.5" />
                Send
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showShare} onOpenChange={setShowShare}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share {selectedGroupData.name}</DialogTitle>
              <DialogDescription>Share this invite code or link for others to join.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/40">
                <code className="flex-1 text-sm font-bold tracking-wider text-center">{selectedGroupData.invite_code || "—"}</code>
                <Button size="icon" variant="ghost" className="size-8 shrink-0" onClick={handleCopyCode}>
                  <Copy className="size-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60 text-center">
                Share this code or direct users to enter it in the "Join by Code" option.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showMembers} onOpenChange={setShowMembers}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Members — {selectedGroupData.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedGroupData.group_members?.map((m) => {
                const name = (m as any).profile?.name || (m as any).profile?.email || m.user_id;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40"
                  >
                    <div className="flex flex-col">
                      <button onClick={() => onUserClick?.(m.user_id, name)} className="text-sm font-medium hover:text-primary transition-colors text-left">
                        {name}
                      </button>
                      {(m as any).profile?.email && (
                        <span className="text-[10px] text-muted-foreground/60">{(m as any).profile.email}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground/60 px-2 py-0.5 rounded-full bg-muted/50">{m.role}</span>
                      {m.role !== "admin" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMember.mutate({ groupId: selectedGroup, memberUserId: m.user_id }); }}
                          className="text-muted-foreground/30 hover:text-destructive transition-colors"
                        >
                          <UserMinus className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!selectedGroupData.group_members || selectedGroupData.group_members.length === 0) && (
                <p className="text-sm text-muted-foreground/60 py-4 text-center">No members yet.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold tracking-tight">Your Groups</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsJoining(true)} className="gap-1.5">
            <Link className="size-3.5" />
            Join
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            New Group
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="mb-6 p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-3"
          >
            <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name..." className="h-9 text-sm" />
            <Input value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="Description (optional)..." className="h-9 text-sm" />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!newGroupName.trim()}>Create</Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isJoining && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-muted/20 rounded-2xl border border-border/40 space-y-3"
          >
            <Input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter invite code..."
              className="h-9 text-sm font-bold tracking-widest text-center"
              maxLength={8}
            />
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setIsJoining(false); setJoinCode(""); }}>Cancel</Button>
              <Button size="sm" onClick={handleJoinByCode} disabled={!joinCode.trim() || joinByCode.isPending}>Join</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {groups.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <Users className="size-10 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">No groups yet. Create your first group!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
              onClick={() => setSelectedGroup(group.id)}
            >
              <div>
                <h3 className="text-sm font-bold">{group.name}</h3>
                {group.description && <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>}
                <p className="text-[10px] font-medium text-muted-foreground/50 mt-1">{group.group_members?.length || 0} members</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteGroup.mutate(group.id); }}
                className="text-muted-foreground/30 hover:text-destructive transition-colors"
              >
                <Trash className="size-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Friends Panel ─────────────────────────────────────────

function FriendsPanel({ onUserClick }: { onUserClick?: (id: string, name: string) => void }) {
  const { data: friendsData, isLoading: loadingFriends } = useFriends();
  const { data: requestsData, isLoading: loadingRequests } = useFriendRequests();
  const { data: leaderboardData } = useFriendsLeaderboard();
  const sendRequest = useSendFriendRequest();
  const respondRequest = useRespondToFriendRequest();
  const removeFriend = useRemoveFriend();

  const [email, setEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    getUserId().then(setCurrentUserId);
  }, []);

  const friends = friendsData?.friends || [];
  const requests = requestsData?.requests || [];
  const leaderboard = leaderboardData?.leaderboard || [];

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await sendRequest.mutateAsync(email.trim());
      setEmail("");
    } catch {}
  };

  const pendingIncoming = requests.filter(
    (r) => r.status === "pending" && r.recipient_id === currentUserId
  );

  if (loadingFriends || loadingRequests) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold tracking-tight">Friends</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setShowFriends(true)}>
              <Users className="size-3.5 mr-2" />
              Friends List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <form onSubmit={handleSendRequest} className="flex items-center gap-2 mb-6">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Invite friend by email..."
          className="h-9 text-sm flex-1"
          type="email"
        />
        <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={!email.trim() || sendRequest.isPending}>
          <Mail className="size-3.5" />
          Send Invite
        </Button>
      </form>

      {pendingIncoming.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pending Requests</h3>
          <div className="space-y-2">
            {pendingIncoming.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-3">
                  <UserPlus className="size-4 text-primary" />
                  <span className="text-sm font-medium">{req.recipient_email}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondRequest.mutate({ requestId: req.id, status: "accepted" })}
                    className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center justify-center"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => respondRequest.mutate({ requestId: req.id, status: "rejected" })}
                    className="size-8 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center justify-center"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showFriends} onOpenChange={setShowFriends}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Friends</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 py-4 text-center">No friends yet. Invite someone by email!</p>
            ) : (
              friends.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40">
                  <div className="flex flex-col">
                    <button onClick={() => { setShowFriends(false); onUserClick?.(f.friend.id, f.friend.email); }} className="text-sm font-medium hover:text-primary transition-colors text-left">
                      {f.friend.email}
                    </button>
                  </div>
                  <button
                    onClick={() => removeFriend.mutate(f.friend.id)}
                    className="text-muted-foreground/30 hover:text-destructive transition-colors"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
        <Trophy className="size-3.5" />
        Friends Leaderboard Today
      </h3>
      {leaderboard.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 py-4">No focus sessions from your friends today.</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry: any, i: number) => {
            const hours = Math.floor(entry.total_seconds / 3600);
            const mins = Math.floor((entry.total_seconds % 3600) / 60);
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={entry.user_id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                  <button onClick={() => onUserClick?.(entry.user_id, entry.name || entry.email)} className="text-sm font-medium hover:text-primary transition-colors text-left">
                    {entry.name || entry.email}
                  </button>
                </div>
                <span className="text-xs font-bold tabular-nums text-muted-foreground">{hours > 0 ? `${hours}h ` : ""}{mins}m</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
