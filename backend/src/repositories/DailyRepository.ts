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
      .select("*, tasks:daily_tasks(*)")
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
    // 1. Check auto-populate settings
    const { data: profile } = await this.supabase
      .from("profiles")
      .select("daily_auto_populate_habits")
      .eq("id", userId)
      .single();

    // 2. Create the log
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

    // 3. Auto-populate habits as tasks if enabled
    if (profile?.daily_auto_populate_habits) {
      const { data: habits } = await this.supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId);
        
      if (habits && habits.length > 0) {
        // Simple logic: insert all active habits as daily tasks
        const tasksToInsert = habits.map(h => ({
          log_id: data.id,
          text: h.text,
          is_completed: false
        }));
        
        await this.supabase.from("daily_tasks").insert(tasksToInsert);
      }
    }

    // 4. Return the full object
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

  async createHabit(userId: string, text: string, frequency: string) {
    const { data, error } = await this.supabase
      .from("habits")
      .insert({ user_id: userId, text, frequency })
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
     
     // Calculate stats
     const totalLogs = logs.length;
     const allTasks = logs.flatMap(l => l.tasks || []);
     const completedTasks = allTasks.filter(t => t.is_completed).length;
     const totalTasks = allTasks.length;
     const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
     
     // Calculate streak
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
     
     return {
       totalLogs,
       completedTasks,
       completionRate,
       streak,
       weeklyData,
       focusScore: Math.min(100, streak * 5 + completionRate * 0.5) // Arbitrary calculation
     };
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
