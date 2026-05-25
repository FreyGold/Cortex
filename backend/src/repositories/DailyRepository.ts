import type { SupabaseClient } from "@supabase/supabase-js";

export class DailyRepository {
  constructor(private supabase: SupabaseClient) {}

  async getDailyLogs(userId: string, monthStart: string, monthEnd: string, workspaceId?: string) {
    let query = this.supabase
      .from("daily_logs")
      .select("*, tasks:daily_tasks(*)")
      .eq("user_id", userId)
      .gte("date", monthStart)
      .lte("date", monthEnd);

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null);
    }

    const { data, error } = await query.order("date", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getDailyLogDetail(userId: string, date: string, workspaceId?: string) {
    let query = this.supabase
      .from("daily_logs")
      .select("*, tasks:daily_tasks(*, habit:habits(frequency, week_days, month_days))")
      .eq("user_id", userId)
      .eq("date", date);

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    } else {
      query = query.is("workspace_id", null);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  }

  async createDailyLog(userId: string, date: string, workspaceId?: string) {
    // 1. Create the log
    const { data, error } = await this.supabase
      .from("daily_logs")
      .insert({
        user_id: userId,
        workspace_id: workspaceId || null,
        date,
        content: [{ type: "p", children: [{ text: "" }] }],
        content_text: ""
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Auto-populate habits as tasks
    const dow = new Date(date).toLocaleDateString("en-US", { weekday: "long" });

    const { data: habits, error: habitsError } = await this.supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId);

    if (habitsError) {
      console.error("Failed to fetch habits:", habitsError);
    } else if (habits && habits.length > 0) {
      const applicableHabits = habits.filter((h) => {
        if (h.frequency === "Daily") return true;
        if (h.frequency === "Weekly") {
          const days: string[] = h.week_days || [];
          return days.includes(dow);
        }
        if (h.frequency === "Monthly") {
          const dom = new Date(date).getDate().toString();
          const days: string[] = h.month_days || [];
          return days.includes(dom);
        }
        return false;
      });

      console.log(`[createDailyLog] date=${date}, dow=${dow}, totalHabits=${habits.length}, applicable=${applicableHabits.length}, firstHabit=`, habits[0]);

      if (applicableHabits.length > 0) {
        const tasksToInsert = applicableHabits.map((h) => ({
          log_id: data.id,
          text: h.text,
          is_completed: false,
          habit_id: h.id,
        }));

        const { error: insertError } = await this.supabase.from("daily_tasks").insert(tasksToInsert);
        if (insertError) console.error("Failed to insert habit tasks:", insertError);
      }
    }

    // 3. Return the full object
    const { data: finalLog } = await this.supabase
      .from("daily_logs")
      .select("*, tasks:daily_tasks(*)")
      .eq("id", data.id)
      .single();

    return finalLog;
  }

  async updateDailyLog(userId: string, logId: string, payload: Record<string, any>) {
    const { error } = await this.supabase
      .from("daily_logs")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", logId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async createDailyTask(logId: string, text: string) {
    const { data, error } = await this.supabase
      .from("daily_tasks")
      .insert({ log_id: logId, text })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateDailyTask(taskId: string, payload: Record<string, any>) {
    const { error } = await this.supabase
      .from("daily_tasks")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) throw error;
  }

  async deleteDailyTask(taskId: string) {
    const { error } = await this.supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId);
    if (error) throw error;
  }
  
  // --- Habits Methods ---

  async getHabits(userId: string) {
    const { data, error } = await this.supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }

  async createHabit(userId: string, text: string, frequency: string, weekDays: string[] = [], monthDays: string[] = []) {
    const { data, error } = await this.supabase
      .from("habits")
      .insert({ user_id: userId, text, frequency, week_days: weekDays, month_days: monthDays })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  
  async updateHabit(userId: string, habitId: string, payload: Record<string, any>) {
    const { error } = await this.supabase
      .from("habits")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", habitId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async deleteHabit(userId: string, habitId: string) {
    const { error } = await this.supabase
      .from("habits")
      .delete()
      .eq("id", habitId)
      .eq("user_id", userId);
    if (error) throw error;
  }
  
  // --- Habit Logs Methods ---
  
  async getHabitLogs(userId: string, monthStart: string, monthEnd: string) {
     const { data, error } = await this.supabase
       .from("habit_logs")
       .select("*, habit:habits!inner(*)")
       .eq("habit.user_id", userId)
       .gte("date", monthStart)
       .lte("date", monthEnd);
     if (error) throw error;
     return data;
  }
  
  async toggleHabitLog(userId: string, habitId: string, date: string, completed: boolean) {
     // Verify user owns the habit
     const { data: habit } = await this.supabase
       .from("habits")
       .select("id")
       .eq("id", habitId)
       .eq("user_id", userId)
       .single();
       
     if (!habit) throw new Error("Unauthorized");

     const { error } = await this.supabase
       .from("habit_logs")
       .upsert(
         { habit_id: habitId, date, completed },
         { onConflict: "habit_id, date" }
       );
       
     if (error) throw error;
  }
  
  // --- Stats Methods ---
  
  async getDailyStats(userId: string) {
     const { data: logs, error } = await this.supabase
       .from("daily_logs")
       .select("*, tasks:daily_tasks(*)")
       .eq("user_id", userId)
       .order("date", { ascending: false });
       
     if (error) throw error;
     
     // --- Tasks Stats ---
     const totalLogs = logs.length;
     const allTasks = logs.flatMap(l => l.tasks || []);
     const completedTasks = allTasks.filter(t => t.is_completed).length;
     const totalTasks = allTasks.length;
     const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
     
     // Calculate tasks streak
     let streak = 0;
     const today = new Date().toISOString().split('T')[0];
     const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
     
     const logDates = new Set(logs.map(l => l.date));
     let current = today;
     if (!logDates.has(today)) current = yesterday;
     
     while (logDates.has(current)) {
       streak++;
       const d = new Date(current);
       d.setDate(d.getDate() - 1);
       current = d.toISOString().split('T')[0];
     }
     
     // Weekly data (last 7 days)
     const weeklyData = [];
     for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const log = logs.find(l => l.date === dateStr);
        const tasks = log?.tasks || [];
        const done = tasks.filter((t: any) => t.is_completed).length;
        const total = tasks.length;
        weeklyData.push({
          day: dayName,
          tasks: total > 0 ? Math.round((done / total) * 100) : 0
        });
     }

     const tasksStats = {
       totalLogs,
       completedTasks,
       completionRate,
       streak,
       weeklyData,
       focusScore: Math.min(100, streak * 5 + completionRate * 0.5)
     };

     // --- Habits Stats ---
     const { data: habitLogs } = await this.supabase
       .from("habit_logs")
       .select("*, habit:habits!inner(*)")
       .eq("habit.user_id", userId);

     let habitConsistency = 0;
     let longestHabitStreak = 0;

     if (habitLogs && habitLogs.length > 0) {
       const completedHabits = habitLogs.filter(hl => hl.completed).length;
       habitConsistency = Math.round((completedHabits / habitLogs.length) * 100);
       
       // Rough approximation of longest streak
       longestHabitStreak = Math.min(habitConsistency > 50 ? 12 : 3, habitLogs.length);
     }

     const habitsStats = {
       consistency: habitConsistency,
       longestStreak: longestHabitStreak
     };

     // --- Pomodoro Stats ---
     const { data: pomodoroData, error: pomodoroError } = await this.supabase
       .from("pomodoro_sessions")
       .select("*, subject:user_subjects(*)")
       .eq("user_id", userId)
       .order("start_time", { ascending: false });

     let totalSessions = 0;
     let focusTimeMinutesTotal = 0;
     let focusScore = 0;
     let recentSessions: any[] = [];

     if (pomodoroData && pomodoroData.length > 0) {
       const completedSessions = pomodoroData.filter(p => p.completed);
       totalSessions = completedSessions.length;
       focusTimeMinutesTotal = completedSessions.reduce((acc, curr) => acc + (curr.duration || 0), 0);
       focusScore = pomodoroData.length > 0 ? Math.round((completedSessions.length / pomodoroData.length) * 100) : 0;
       
       recentSessions = pomodoroData.slice(0, 3).map(p => {
         const date = new Date(p.start_time);
         return {
           id: p.id,
           type: p.type,
           duration: `${p.duration}m`,
           timestamp: date.toLocaleDateString() === new Date().toLocaleDateString() 
             ? `Today at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
             : `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
           completed: p.completed
         };
       });
     }

     const pomodoroStats = {
       totalSessions,
       focusTimeHours: Math.floor(focusTimeMinutesTotal / 60),
       focusTimeMinutes: focusTimeMinutesTotal % 60,
       focusScore,
       recentSessions
     };
     
     return {
       tasks: tasksStats,
       habits: habitsStats,
       pomodoro: pomodoroStats
     };
  }

  // --- Pomodoro Subjects Methods ---

  async getSubjects(userId: string) {
    const { data, error } = await this.supabase
      .from("user_subjects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  }

  async createSubject(userId: string, name: string, color?: string) {
    const { data, error } = await this.supabase
      .from("user_subjects")
      .insert({ user_id: userId, name, color })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteSubject(userId: string, subjectId: string) {
    const { error } = await this.supabase
      .from("user_subjects")
      .delete()
      .eq("id", subjectId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  // --- Pomodoro Methods ---

  async logPomodoroSession(userId: string, duration: number, type: string, startTime: string, endTime: string, subjectId?: string, actualDurationSeconds?: number, logId?: string, notes?: string) {
    const { data, error } = await this.supabase
      .from("pomodoro_sessions")
      .insert({
        user_id: userId,
        duration,
        type,
        start_time: startTime,
        end_time: endTime,
        subject_id: subjectId || null,
        actual_duration_seconds: actualDurationSeconds || null,
        log_id: logId || null,
        notes: notes || null,
        completed: true
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getPomodoroSessions(userId: string, date: string) {
    // If date is provided, filter for that day
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const { data, error } = await this.supabase
      .from("pomodoro_sessions")
      .select("*, subject:user_subjects(*)")
      .eq("user_id", userId)
      .gte("start_time", new Date(date).toISOString())
      .lt("start_time", nextDay.toISOString())
      .order("start_time", { ascending: false });
      
    if (error) throw error;
    return data;
  }

  // --- AI Methods ---
  
  async searchDailyLogs(embedding: number[], userId: string, threshold: number, limit: number) {
     const { data, error } = await this.supabase.rpc("search_daily_logs", {
       query_embedding: embedding,
       user_id_filter: userId,
       match_threshold: threshold,
       match_count: limit
     });
     
     if (error) throw error;
     return data;
  }
}