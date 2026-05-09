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
      const { text, frequency } = req.body;
      if (!text) return res.status(400).json({ error: "Habit text is required" });
      const habit = await service.createHabit(req.user!.id, text, frequency || 'Daily');
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
}
