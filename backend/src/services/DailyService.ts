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

    const textForEmbedding = `${finalPayload.highlight || ""}\n${finalPayload.content_text || ""}`.trim();
    if (textForEmbedding) {
      try {
        const embedding = await embedText(`passage: ${textForEmbedding}`);
        finalPayload.embedding = embedding;
      } catch (e) {
        console.error("Failed to generate embedding for daily log", e);
      }
    }

    await this.repo.updateDailyLog(userId, logId, finalPayload);
  }

  async createDailyTask(logId: string, text: string) {
    return this.repo.createDailyTask(logId, text);
  }

  async updateDailyTask(taskId: string, payload: Record<string, any>) {
    await this.repo.updateDailyTask(taskId, payload);
  }

  async deleteDailyTask(taskId: string) {
    await this.repo.deleteDailyTask(taskId);
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

  async searchDailyLogs(userId: string, query: string, threshold = 0.5, limit = 10) {
    const embedding = await embedText(`query: ${query.trim()}`);
    return this.repo.searchDailyLogs(embedding, userId, threshold, limit);
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
}
