import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { DailyController } from "../controllers/DailyController";

export const dailyRouter = Router();

dailyRouter.use(authMiddleware);

dailyRouter.get("/", DailyController.getDailyLogs);
dailyRouter.post("/", DailyController.createDailyLog);
dailyRouter.get("/:date", DailyController.getDailyLogDetail);
dailyRouter.put("/logs/:logId", DailyController.updateDailyLog);
dailyRouter.post("/tasks", DailyController.createDailyTask);
dailyRouter.put("/tasks/:taskId", DailyController.updateDailyTask);
dailyRouter.delete("/tasks/:taskId", DailyController.deleteDailyTask);

// Habits
dailyRouter.get("/habits", DailyController.getHabits);
dailyRouter.post("/habits", DailyController.createHabit);
dailyRouter.put("/habits/:habitId", DailyController.updateHabit);
dailyRouter.delete("/habits/:habitId", DailyController.deleteHabit);

// Habit Logs
dailyRouter.get("/habit-logs", DailyController.getHabitLogs);
dailyRouter.put("/habits/:habitId/logs", DailyController.toggleHabitLog);

// Stats
dailyRouter.get("/stats", DailyController.getDailyStats);

// AI Features
dailyRouter.post("/search", DailyController.searchDailyLogs);
