import { DailyRepository } from "../repositories/DailyRepository";
import { embedText } from "./AIService";

/**
 * Walk Plate (Slate-based) JSON and extract all leaf text nodes
 * into a single plain-text string, suitable for embedding.
 */
function extractPlateText(nodes: any[]): string {
  if (!Array.isArray(nodes)) return "";
  const parts: string[] = [];
  const walk = (node: any) => {
    if (typeof node?.text === "string") {
      parts.push(node.text);
    } else if (Array.isArray(node?.children)) {
      node.children.forEach(walk);
    }
  };
  nodes.forEach(walk);
  return parts.join(" ").trim();
}

export class DailyService {
  constructor(private repo: DailyRepository) {}

  async getDailyLogs(userId: string, monthStart: string, monthEnd: string, workspaceId?: string) {
    return this.repo.getDailyLogs(userId, monthStart, monthEnd, workspaceId);
  }

  async getDailyLogDetail(userId: string, date: string, workspaceId?: string) {
    return this.repo.getDailyLogDetail(userId, date, workspaceId);
  }

  async createDailyLog(userId: string, date: string, workspaceId?: string) {
    return this.repo.createDailyLog(userId, date, workspaceId);
  }

  async updateDailyLog(userId: string, logId: string, payload: Record<string, any>) {
    const finalPayload = { ...payload };

    // Normalize camelCase keys from frontend → snake_case for the DB
    if ("contentText" in payload) {
      finalPayload.content_text = payload.contentText;
      delete finalPayload.contentText;
    }

    // If the frontend sent Plate JSON content but no content_text,
    // extract plain text from the Plate nodes so embeddings always work.
    if (payload.content && !finalPayload.content_text) {
      finalPayload.content_text = extractPlateText(payload.content);
    }

    await this.repo.updateDailyLog(userId, logId, finalPayload);
    await this.syncLogEmbedding(userId, logId);
  }

  async syncLogEmbedding(userId: string, logId: string) {
    try {
      const log = await this.repo.getDailyLogById(userId, logId);
      if (!log) return;

      const textParts: string[] = [];
      if (log.highlight) textParts.push(`Highlight: ${log.highlight}`);
      if (log.content_text) textParts.push(`Note: ${log.content_text}`);
      if (log.tasks && log.tasks.length > 0) {
        const taskTexts = log.tasks.map((t: any) => `- [${t.is_completed ? "x" : " "}] ${t.text}`).join("\n");
        textParts.push(`Tasks:\n${taskTexts}`);
      }

      const textForEmbedding = textParts.join("\n\n").trim();
      if (textForEmbedding) {
        const embedding = await embedText(`passage: ${textForEmbedding}`);
        await this.repo.updateDailyLog(userId, logId, { embedding });
      }
    } catch (e) {
      console.error("Failed to sync daily log embedding:", e);
    }
  }

  async createDailyTask(userId: string, logId: string, text: string) {
    const task = await this.repo.createDailyTask(logId, text);
    await this.syncLogEmbedding(userId, logId);
    return task;
  }

  async updateDailyTask(userId: string, taskId: string, payload: Record<string, any>) {
    await this.repo.updateDailyTask(taskId, payload);
    const task = await this.repo.getDailyTaskById(taskId);
    if (task) {
      await this.syncLogEmbedding(userId, task.log_id);
    }
  }

  async deleteDailyTask(userId: string, taskId: string) {
    const task = await this.repo.getDailyTaskById(taskId);
    if (!task) return;
    await this.repo.deleteDailyTask(taskId);
    await this.syncLogEmbedding(userId, task.log_id);
  }

  // --- Habits Methods ---

  async getHabits(userId: string) {
    return this.repo.getHabits(userId);
  }

  async createHabit(userId: string, text: string, frequency: string, weekDays: string[] = [], monthDays: string[] = []) {
    return this.repo.createHabit(userId, text, frequency, weekDays, monthDays);
  }

  async updateHabit(userId: string, habitId: string, payload: Record<string, any>) {
    await this.repo.updateHabit(userId, habitId, payload);
  }

  async deleteHabit(userId: string, habitId: string) {
    await this.repo.deleteHabit(userId, habitId);
  }

  async getHabitLogs(userId: string, monthStart: string, monthEnd: string) {
    return this.repo.getHabitLogs(userId, monthStart, monthEnd);
  }

  async toggleHabitLog(userId: string, habitId: string, date: string, completed: boolean) {
    await this.repo.toggleHabitLog(userId, habitId, date, completed);
  }

  async getDailyStats(userId: string) {
    return this.repo.getDailyStats(userId);
  }

  // --- Pomodoro Subjects ---

  async getSubjects(userId: string) {
    return this.repo.getSubjects(userId);
  }

  async createSubject(userId: string, name: string, color?: string) {
    return this.repo.createSubject(userId, name, color);
  }

  async deleteSubject(userId: string, subjectId: string) {
    await this.repo.deleteSubject(userId, subjectId);
  }

  // --- Pomodoro Methods ---

  async logPomodoroSession(userId: string, duration: number, type: string, startTime: string, endTime: string, subjectId?: string, actualDurationSeconds?: number, logId?: string, notes?: string) {
    return this.repo.logPomodoroSession(userId, duration, type, startTime, endTime, subjectId, actualDurationSeconds, logId, notes);
  }

  async getPomodoroSessions(userId: string, date: string) {
    return this.repo.getPomodoroSessions(userId, date);
  }

  // --- AI Methods ---

  async searchDailyLogs(userId: string, query: string, threshold = 0.15, limit = 10) {
    const embedding = await embedText(`query: ${query.trim()}`);
    return this.repo.searchDailyLogs(embedding, userId, threshold, limit);
  }

  async askAssistant(userId: string, question: string, messages: any[]) {
    // 1. Semantic search for specific matching logs
    const embedding = await embedText(`query: ${question.trim()}`);
    const searchMatches = await this.repo.searchDailyLogs(embedding, userId, 0.15, 10);

    // 2. Fetch recent daily logs (last 30 logs) for temporal/summary queries
    const recentLogs = await this.repo.getRecentDailyLogs(userId, 30);

    // 3. Construct the context block
    let contextBlock = "";

    if (searchMatches && searchMatches.length > 0) {
      contextBlock += "--- SEMANTIC SEARCH MATCHES (RELEVANT ENTRIES) ---\n";
      for (const m of searchMatches) {
        contextBlock += `[Date: ${m.date}] Highlight: ${m.highlight || "None"}. Note: ${m.content_text || "None"}\n`;
      }
      contextBlock += "\n";
    }

    if (recentLogs && recentLogs.length > 0) {
      contextBlock += "--- RECENT DAILY LOGS (CHRONOLOGICAL HISTORY) ---\n";
      // We sort ascending for the LLM to read chronologically
      const sortedLogs = [...recentLogs].reverse();
      for (const log of sortedLogs) {
        contextBlock += `[Date: ${log.date}] Highlight: ${log.highlight || "None"}. Note: ${log.content_text || "None"}\n`;
        if (log.tasks && log.tasks.length > 0) {
          contextBlock += "Tasks:\n";
          for (const t of log.tasks) {
            contextBlock += `- [${t.is_completed ? "x" : " "}] ${t.text}\n`;
          }
        }
        if (log.pomodoro_sessions && log.pomodoro_sessions.length > 0) {
          contextBlock += "Pomodoro Sessions:\n";
          for (const s of log.pomodoro_sessions) {
            contextBlock += `- ${s.type} session: ${s.duration} minutes (${s.completed ? "completed" : "incomplete"}). Notes: ${s.notes || "None"}\n`;
          }
        }
        contextBlock += "\n";
      }
    }

    if (!contextBlock) {
      contextBlock = "No daily logs or history found for this user.";
    }

    // 4. Send to Gemini
    const chatHistory = [...messages, { role: "user", content: question }];
    const { answer, model } = await this.chatGeminiWithContext(chatHistory, contextBlock);

    return { answer, model };
  }

  private async chatGeminiWithContext(messages: any[], context: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const systemPrompt = `You are a helpful Daily Tracker Assistant for a student's personal knowledge base.
Answer the user's questions about their daily tracking logs, tasks, pomodoro study sessions, habits, and progress.
Use the provided context containing relevant daily logs and chronological history. If the user asks for a summary of last month or a specific timeframe, summarize the logs from the context.
Answer accurately, friendly, and in the same language as the user. Do not make up information; base your answers strictly on the context.

USER DAILY LOGS CONTEXT:
${context}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.45, topP: 0.9, maxOutputTokens: 2048 },
        }),
      }
    );

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "Gemini Chat request failed.");

    const answer = payload.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("").trim() ?? "";
    if (!answer) throw new Error("Gemini returned no response.");

    return { answer, model };
  }

  // ── Groups ───────────────────────────────────────────

  async getGroups(userId: string) {
    return this.repo.getGroups(userId);
  }

  async createGroup(userId: string, name: string, description?: string) {
    if (!name?.trim()) throw new Error("Group name is required");
    return this.repo.createGroup(userId, name.trim(), description?.trim());
  }

  async updateGroup(userId: string, groupId: string, payload: Record<string, any>) {
    await this.repo.updateGroup(userId, groupId, payload);
  }

  async deleteGroup(userId: string, groupId: string) {
    await this.repo.deleteGroup(userId, groupId);
  }

  async getGroupMembers(groupId: string) {
    return this.repo.getGroupMembers(groupId);
  }

  async addGroupMember(userId: string, groupId: string, memberUserId: string) {
    return this.repo.addGroupMember(userId, groupId, memberUserId);
  }

  async addGroupMemberByEmail(userId: string, groupId: string, email: string) {
    const profile = await this.repo.getProfilesByEmail(email);
    if (!profile) throw new Error("User with this email not found");
    return this.repo.addGroupMember(userId, groupId, profile.id);
  }

  async removeGroupMember(groupId: string, memberUserId: string) {
    await this.repo.removeGroupMember(groupId, memberUserId);
  }

  async createGroupInvitation(userId: string, groupId: string, email: string) {
    if (!email?.trim()) throw new Error("Email is required");
    return this.repo.createGroupInvitation(userId, groupId, email.trim().toLowerCase());
  }

  async getGroupInvitations(groupId: string) {
    return this.repo.getGroupInvitations(groupId);
  }

  async respondToGroupInvitation(invitationId: string, userId: string, status: "accepted" | "rejected") {
    await this.repo.respondToGroupInvitation(invitationId, userId, status);
  }

  async joinGroupByCode(userId: string, code: string) {
    if (!code?.trim()) throw new Error("Invite code is required");
    return this.repo.joinGroupByCode(userId, code.trim());
  }

  async getGroupByInviteCode(code: string) {
    return this.repo.getGroupByInviteCode(code);
  }

  // ── Friends ──────────────────────────────────────────

  async getFriends(userId: string) {
    return this.repo.getFriends(userId);
  }

  async getFriendRequests(userId: string) {
    return this.repo.getFriendRequests(userId);
  }

  async sendFriendRequest(userId: string, recipientEmail: string) {
    if (!recipientEmail?.trim()) throw new Error("Recipient email is required");
    return this.repo.sendFriendRequest(userId, recipientEmail.trim().toLowerCase());
  }

  async respondToFriendRequest(requestId: string, userId: string, status: "accepted" | "rejected") {
    await this.repo.respondToFriendRequest(requestId, userId, status);
  }

  async cancelFriendRequest(requestId: string, userId: string) {
    await this.repo.cancelFriendRequest(requestId, userId);
  }

  async removeFriend(userId: string, friendId: string) {
    await this.repo.removeFriend(userId, friendId);
  }

  // ── Leaderboard ──────────────────────────────────────

  async getLeaderboard() {
    return this.repo.getLeaderboard();
  }

  async getGroupLeaderboard(groupId: string) {
    return this.repo.getGroupLeaderboard(groupId);
  }

  async getFriendsLeaderboard(userId: string) {
    return this.repo.getFriendsLeaderboard(userId);
  }

  async getUserMonthlyLog(targetUserId: string, year: number, month: number) {
    return this.repo.getUserMonthlyLog(targetUserId, year, month);
  }

  async getUserYearlyLog(targetUserId: string, year: number) {
    return this.repo.getUserYearlyLog(targetUserId, year);
  }

  async rebuildUserEmbeddings(userId: string) {
    const logs = await this.repo.getRecentDailyLogs(userId, 100);
    if (!logs) return 0;
    let count = 0;
    for (const log of logs) {
      await this.syncLogEmbedding(userId, log.id);
      count++;
    }
    return count;
  }
}
