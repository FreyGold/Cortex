import type { Request, Response } from "express";
import { DailyService } from "../services/DailyService";
import { DailyRepository } from "../repositories/DailyRepository";
import { getSupabaseUserClient } from "../lib/supabase-admin";

function getService(req: Request) {
  const accessToken = req.user!.accessToken!;
  const supabase = getSupabaseUserClient(accessToken);
  const repo = new DailyRepository(supabase);
  return new DailyService(repo);
}

export class DailyController {
  static async getDailyLogs(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { start, end, workspaceId } = req.query;
      if (!start || !end) {
        return res.status(400).json({ error: "Start and end dates are required" });
      }
      const logs = await service.getDailyLogs(req.user!.id, start as string, end as string, workspaceId as string);
      return res.status(200).json({ logs });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getDailyLogDetail(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { date } = req.params;
      const { workspaceId } = req.query;
      const log = await service.getDailyLogDetail(req.user!.id, date as string, workspaceId as string);
      return res.status(200).json({ log });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createDailyLog(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { date, workspaceId } = req.body;
      if (!date) return res.status(400).json({ error: "Date is required" });
      const log = await service.createDailyLog(req.user!.id, date, workspaceId);
      return res.status(201).json({ log });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateDailyLog(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { logId } = req.params;
      await service.updateDailyLog(req.user!.id, logId as string, req.body);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createDailyTask(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { logId, text } = req.body;
      if (!logId || !text) return res.status(400).json({ error: "logId and text are required" });
      const task = await service.createDailyTask(logId, text);
      return res.status(201).json({ task });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateDailyTask(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { taskId } = req.params;
      await service.updateDailyTask(taskId as string, req.body);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteDailyTask(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { taskId } = req.params;
      await service.deleteDailyTask(taskId as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // --- Habits Endpoints ---

  static async getHabits(req: Request, res: Response) {
    try {
      const service = getService(req);
      const habits = await service.getHabits(req.user!.id);
      return res.status(200).json({ habits });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createHabit(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { text, frequency, week_days, month_days } = req.body;
      if (!text) return res.status(400).json({ error: "Habit text is required" });
      const weekDays: string[] = Array.isArray(week_days) ? week_days : [];
      const monthDays: string[] = Array.isArray(month_days) ? month_days : [];
      const habit = await service.createHabit(req.user!.id, text, frequency || "Daily", weekDays, monthDays);
      return res.status(201).json({ habit });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateHabit(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { habitId } = req.params;
      await service.updateHabit(req.user!.id, habitId as string, req.body);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteHabit(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { habitId } = req.params;
      await service.deleteHabit(req.user!.id, habitId as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getHabitLogs(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { start, end } = req.query;
      if (!start || !end) return res.status(400).json({ error: "Start and end dates are required" });
      const logs = await service.getHabitLogs(req.user!.id, start as string, end as string);
      return res.status(200).json({ logs });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async toggleHabitLog(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { habitId } = req.params;
      const { date, completed } = req.body;
      if (!date || completed === undefined) return res.status(400).json({ error: "Date and completed status are required" });
      await service.toggleHabitLog(req.user!.id, habitId as string, date, completed);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getDailyStats(req: Request, res: Response) {
    try {
      const service = getService(req);
      const stats = await service.getDailyStats(req.user!.id);
      return res.status(200).json({ stats });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // --- Subjects Endpoints ---

  static async getSubjects(req: Request, res: Response) {
    try {
      const service = getService(req);
      const subjects = await service.getSubjects(req.user!.id);
      return res.status(200).json({ subjects });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createSubject(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { name, color } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const subject = await service.createSubject(req.user!.id, name, color);
      return res.status(201).json({ subject });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteSubject(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { subjectId } = req.params;
      await service.deleteSubject(req.user!.id, subjectId as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // --- Pomodoro Endpoints ---

  static async logPomodoroSession(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { duration, type, startTime, endTime, subjectId, actualDurationSeconds, logId, notes } = req.body;
      if (!duration || !type || !startTime || !endTime) return res.status(400).json({ error: "duration, type, startTime, and endTime are required" });
      const session = await service.logPomodoroSession(req.user!.id, duration, type, startTime, endTime, subjectId, actualDurationSeconds, logId, notes);
      return res.status(201).json({ session });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getPomodoroSessions(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: "Date is required" });
      const sessions = await service.getPomodoroSessions(req.user!.id, date as string);
      return res.status(200).json({ sessions });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ── Groups Endpoints ─────────────────────────────────

  static async getGroups(req: Request, res: Response) {
    try {
      const service = getService(req);
      const groups = await service.getGroups(req.user!.id);
      return res.status(200).json({ groups });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createGroup(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const group = await service.createGroup(req.user!.id, name, description);
      return res.status(201).json({ group });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateGroup(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId } = req.params;
      await service.updateGroup(req.user!.id, groupId as string, req.body);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteGroup(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId } = req.params;
      await service.deleteGroup(req.user!.id, groupId as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getGroupMembers(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId } = req.params;
      const members = await service.getGroupMembers(groupId as string);
      return res.status(200).json({ members });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async addGroupMember(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId } = req.params;
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "email is required" });
      const member = await service.addGroupMemberByEmail(req.user!.id, groupId as string, email);
      return res.status(201).json({ member });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async removeGroupMember(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId, memberUserId } = req.params;
      await service.removeGroupMember(groupId as string, memberUserId as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createGroupInvitation(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId } = req.params;
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const invitation = await service.createGroupInvitation(req.user!.id, groupId as string, email);
      return res.status(201).json({ invitation });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getGroupInvitations(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId } = req.params;
      const invitations = await service.getGroupInvitations(groupId as string);
      return res.status(200).json({ invitations });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async respondToGroupInvitation(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { invitationId } = req.params;
      const { status } = req.body;
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      await service.respondToGroupInvitation(invitationId as string, req.user!.id, status);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async joinGroupByCode(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Code is required" });
      const member = await service.joinGroupByCode(req.user!.id, code);
      return res.status(200).json({ member });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getGroupByInviteCode(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { code } = req.params;
      const group = await service.getGroupByInviteCode(code as string);
      if (!group) return res.status(404).json({ error: "Invalid invite code" });
      return res.status(200).json({ group });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ── Friends Endpoints ────────────────────────────────

  static async getFriends(req: Request, res: Response) {
    try {
      const service = getService(req);
      const friends = await service.getFriends(req.user!.id);
      return res.status(200).json({ friends });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getFriendRequests(req: Request, res: Response) {
    try {
      const service = getService(req);
      const requests = await service.getFriendRequests(req.user!.id);
      return res.status(200).json({ requests });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async sendFriendRequest(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const request = await service.sendFriendRequest(req.user!.id, email);
      return res.status(201).json({ request });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async respondToFriendRequest(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { requestId } = req.params;
      const { status } = req.body;
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
      }
      await service.respondToFriendRequest(requestId as string, req.user!.id, status);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async cancelFriendRequest(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { requestId } = req.params;
      await service.cancelFriendRequest(requestId as string, req.user!.id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async removeFriend(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { friendId } = req.params;
      await service.removeFriend(req.user!.id, friendId as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // ── Leaderboard Endpoints ────────────────────────────

  static async getLeaderboard(req: Request, res: Response) {
    try {
      const service = getService(req);
      const leaderboard = await service.getLeaderboard();
      return res.status(200).json({ leaderboard });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getGroupLeaderboard(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { groupId } = req.params;
      const leaderboard = await service.getGroupLeaderboard(groupId as string);
      return res.status(200).json({ leaderboard });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getFriendsLeaderboard(req: Request, res: Response) {
    try {
      const service = getService(req);
      const leaderboard = await service.getFriendsLeaderboard(req.user!.id);
      return res.status(200).json({ leaderboard });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getUserMonthlyLog(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { userId } = req.params;
      const { year, month } = req.query;
      if (!year || !month) return res.status(400).json({ error: "year and month are required" });
      const log = await service.getUserMonthlyLog(userId as string, parseInt(year as string), parseInt(month as string));
      return res.status(200).json({ log });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getUserYearlyLog(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { userId } = req.params;
      const { year } = req.query;
      if (!year) return res.status(400).json({ error: "year is required" });
      const log = await service.getUserYearlyLog(userId as string, parseInt(year as string));
      return res.status(200).json({ log });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // --- AI Endpoints ---
  static async searchDailyLogs(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { query, threshold, limit } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });
      const results = await service.searchDailyLogs(req.user!.id, query, threshold, limit);
      return res.status(200).json({ results });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async askAssistant(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { question, messages = [] } = req.body;
      if (!question) return res.status(400).json({ error: "question is required" });
      const result = await service.askAssistant(req.user!.id, question, messages);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
