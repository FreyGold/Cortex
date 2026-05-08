import { DailyRepository } from "../repositories/DailyRepository";
import { embedText } from "./AIService";

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
    if (payload.content_text || payload.highlight) {
      try {
        const textToEmbed = `${payload.highlight || ''}\n${payload.content_text || ''}`.trim();
        if (textToEmbed) {
          const embedding = await embedText(`passage: ${textToEmbed}`);
          finalPayload.embedding = embedding;
        }
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

  async createHabit(userId: string, text: string, frequency: string) {
    return this.repo.createHabit(userId, text, frequency);
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

  // --- AI Methods ---

  async searchDailyLogs(userId: string, query: string, threshold = 0.5, limit = 10) {
    const embedding = await embedText(`query: ${query.trim()}`);
    return this.repo.searchDailyLogs(embedding, userId, threshold, limit);
  }
}
