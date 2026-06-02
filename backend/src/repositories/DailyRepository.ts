import type { SupabaseClient } from "@supabase/supabase-js";

export class DailyRepository {
  constructor(private supabase: SupabaseClient) {}

  async getDailyLogs(userId: string, monthStart: string, monthEnd: string, workspaceId?: string) {
    let query = this.supabase
      .from("daily_logs")
      .select("*, tasks:daily_tasks(*), pomodoro_sessions:pomodoro_sessions(*)")
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
      .select("*, tasks:daily_tasks(*, habit:habits(frequency, week_days, month_days)), pomodoro_sessions:pomodoro_sessions(*)")
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

   // ── Groups Methods ─────────────────────────────────────

   async getGroups(userId: string) {
      const { data, error } = await this.supabase
        .from("groups")
        .select("*, group_members(*, profile:profiles(id, email, name))");
      if (error) throw error;
      return data;
   }

   async createGroup(userId: string, name: string, description?: string) {
      const { data, error } = await this.supabase
        .from("groups")
        .insert({ name, description, created_by: userId })
        .select()
        .single();
      if (error) throw error;

      // Auto-add creator as admin member
      const { error: memberError } = await this.supabase
        .from("group_members")
        .insert({ group_id: data.id, user_id: userId, role: "admin" });
      if (memberError) throw memberError;

      return data;
   }

   async updateGroup(userId: string, groupId: string, payload: Record<string, any>) {
      const { error } = await this.supabase
        .from("groups")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", groupId)
        .eq("created_by", userId);
      if (error) throw error;
   }

   async deleteGroup(userId: string, groupId: string) {
      const { error } = await this.supabase
        .from("groups")
        .delete()
        .eq("id", groupId)
        .eq("created_by", userId);
      if (error) throw error;
   }

   async getGroupMembers(groupId: string) {
      const { data, error } = await this.supabase
        .from("group_members")
        .select("*, profile:profiles(id, email, name)")
        .eq("group_id", groupId);
      if (error) throw error;
      return data;
   }

   async addGroupMember(userId: string, groupId: string, memberUserId: string) {
      const { data, error } = await this.supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: memberUserId, role: "member" })
        .select()
        .single();
      if (error) throw error;
      return data;
   }

   async removeGroupMember(groupId: string, memberUserId: string) {
      const { error } = await this.supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", memberUserId);
      if (error) throw error;
   }

   async getProfilesByEmail(email: string) {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      return data;
   }

   // ── Friends Methods ────────────────────────────────────

   async getFriends(userId: string) {
      const { data, error } = await this.supabase
        .from("friends")
        .select("*, user1:profiles!friends_user_id_1_fkey(id, email), user2:profiles!friends_user_id_2_fkey(id, email)")
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);
      if (error) throw error;
      return data.map((f: any) => {
        const friend = f.user_id_1 === userId ? f.user2 : f.user1;
        return { id: f.id, friend, created_at: f.created_at };
      });
   }

   async getFriendRequests(userId: string) {
      const { data, error } = await this.supabase
        .from("friend_requests")
        .select("*")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
   }

   async sendFriendRequest(userId: string, recipientEmail: string) {
      // Check if recipient exists
      const profile = await this.getProfilesByEmail(recipientEmail);
      const recipientId = profile?.id || null;

      // Check if already friends
      if (recipientId) {
        const userA = userId < recipientId ? userId : recipientId;
        const userB = userId < recipientId ? recipientId : userId;
        const { data: existing } = await this.supabase
          .from("friends")
          .select("id")
          .eq("user_id_1", userA)
          .eq("user_id_2", userB)
          .maybeSingle();
        if (existing) throw new Error("Already friends with this user");
      }

      // Check existing pending request
      const { data: existingReq } = await this.supabase
        .from("friend_requests")
        .select("id")
        .eq("sender_id", userId)
        .eq("recipient_email", recipientEmail)
        .eq("status", "pending")
        .maybeSingle();
      if (existingReq) throw new Error("Friend request already sent");

      const { data, error } = await this.supabase
        .from("friend_requests")
        .insert({ sender_id: userId, recipient_email: recipientEmail, recipient_id: recipientId })
        .select()
        .single();
      if (error) throw error;
      return data;
   }

   async respondToFriendRequest(requestId: string, userId: string, status: "accepted" | "rejected") {
      const { data: request } = await this.supabase
        .from("friend_requests")
        .select("*")
        .eq("id", requestId)
        .single();
      if (!request) throw new Error("Friend request not found");
      if (request.recipient_id !== userId) throw new Error("Unauthorized");

      if (status === "accepted") {
        const userA = request.sender_id < userId ? request.sender_id : userId;
        const userB = request.sender_id < userId ? userId : request.sender_id;
        const { error: friendError } = await this.supabase
          .from("friends")
          .insert({ user_id_1: userA, user_id_2: userB });
        if (friendError) throw friendError;
      }

      const { error } = await this.supabase
        .from("friend_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
   }

   async cancelFriendRequest(requestId: string, userId: string) {
      const { error } = await this.supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId)
        .eq("sender_id", userId);
      if (error) throw error;
   }

   async removeFriend(userId: string, friendId: string) {
      const userA = userId < friendId ? userId : friendId;
      const userB = userId < friendId ? friendId : userId;
      const { error } = await this.supabase
        .from("friends")
        .delete()
        .eq("user_id_1", userA)
        .eq("user_id_2", userB);
      if (error) throw error;
   }

   // ── Leaderboard Methods ────────────────────────────────

   async getLeaderboard() {
      const { data, error } = await this.supabase.rpc("get_leaderboard");
      if (error) throw error;
      return data;
   }

   // ── Group Invitations ──────────────────────────────────

   async createGroupInvitation(userId: string, groupId: string, email: string) {
      const profile = await this.getProfilesByEmail(email);
      const { data, error } = await this.supabase
        .from("group_invitations")
        .insert({
          group_id: groupId,
          invited_email: email,
          invited_by: userId,
          invited_user_id: profile?.id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
   }

   async getGroupInvitations(groupId: string) {
      const { data, error } = await this.supabase
        .from("group_invitations")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
   }

   async respondToGroupInvitation(invitationId: string, userId: string, status: "accepted" | "rejected") {
      const { data: invitation } = await this.supabase
        .from("group_invitations")
        .select("*")
        .eq("id", invitationId)
        .single();
      if (!invitation) throw new Error("Invitation not found");
      if (invitation.invited_user_id !== userId) throw new Error("Unauthorized");

      if (status === "accepted") {
        await this.addGroupMember(userId, invitation.group_id, userId);
      }

      const { error } = await this.supabase
        .from("group_invitations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", invitationId);
      if (error) throw error;
   }

   async joinGroupByCode(userId: string, code: string) {
      const { data: group, error } = await this.supabase
        .from("groups")
        .select("id")
        .eq("invite_code", code.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!group) throw new Error("Invalid invite code");

      // Check if already a member
      const { data: existing } = await this.supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) throw new Error("Already a member of this group");

      return this.addGroupMember(userId, group.id, userId);
   }

   async getGroupByInviteCode(code: string) {
      const { data, error } = await this.supabase
        .from("groups")
        .select("id, name, invite_code")
        .eq("invite_code", code.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data;
   }

   async getGroupLeaderboard(groupId: string) {
      const { data, error } = await this.supabase.rpc("get_group_leaderboard", {
        p_group_id: groupId
      });
      if (error) throw error;
      return data;
   }

   async getFriendsLeaderboard(userId: string) {
      const { data, error } = await this.supabase.rpc("get_friends_leaderboard", {
        p_user_id: userId
      });
      if (error) throw error;
      return data;
   }

   async getUserMonthlyLog(targetUserId: string, year: number, month: number) {
      const { data, error } = await this.supabase.rpc("get_user_monthly_log", {
        p_user_id: targetUserId,
        p_year: year,
        p_month: month
      });
      if (error) throw error;
      return data;
   }

   async getUserYearlyLog(targetUserId: string, year: number) {
      const { data, error } = await this.supabase.rpc("get_user_yearly_log", {
        p_user_id: targetUserId,
        p_year: year
      });
      if (error) throw error;
      return data;
   }
}