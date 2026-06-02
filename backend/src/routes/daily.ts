import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { DailyController } from "../controllers/DailyController";

export const dailyRouter = Router();

dailyRouter.use(authMiddleware);

// Pomodoro
dailyRouter.get("/pomodoro", DailyController.getPomodoroSessions);
dailyRouter.post("/pomodoro", DailyController.logPomodoroSession);

// Subjects
dailyRouter.get("/subjects", DailyController.getSubjects);
dailyRouter.post("/subjects", DailyController.createSubject);
dailyRouter.delete("/subjects/:subjectId", DailyController.deleteSubject);

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

// Groups
dailyRouter.get("/groups", DailyController.getGroups);
dailyRouter.post("/groups", DailyController.createGroup);
dailyRouter.put("/groups/:groupId", DailyController.updateGroup);
dailyRouter.delete("/groups/:groupId", DailyController.deleteGroup);
dailyRouter.get("/groups/:groupId/members", DailyController.getGroupMembers);
dailyRouter.post("/groups/:groupId/members", DailyController.addGroupMember);
dailyRouter.post("/groups/:groupId/invitations", DailyController.createGroupInvitation);
dailyRouter.get("/groups/:groupId/invitations", DailyController.getGroupInvitations);
dailyRouter.put("/group-invitations/:invitationId", DailyController.respondToGroupInvitation);
dailyRouter.post("/groups/join", DailyController.joinGroupByCode);
dailyRouter.get("/groups/lookup/:code", DailyController.getGroupByInviteCode);
dailyRouter.delete("/groups/:groupId/members/:memberUserId", DailyController.removeGroupMember);

// Friends
dailyRouter.get("/friends", DailyController.getFriends);
dailyRouter.get("/friend-requests", DailyController.getFriendRequests);
dailyRouter.post("/friend-requests", DailyController.sendFriendRequest);
dailyRouter.put("/friend-requests/:requestId", DailyController.respondToFriendRequest);
dailyRouter.delete("/friend-requests/:requestId", DailyController.cancelFriendRequest);
dailyRouter.delete("/friends/:friendId", DailyController.removeFriend);

// Leaderboard
dailyRouter.get("/leaderboard", DailyController.getLeaderboard);
dailyRouter.get("/leaderboard/groups/:groupId", DailyController.getGroupLeaderboard);
dailyRouter.get("/leaderboard/friends", DailyController.getFriendsLeaderboard);
dailyRouter.get("/users/:userId/monthly-log", DailyController.getUserMonthlyLog);
dailyRouter.get("/users/:userId/yearly-log", DailyController.getUserYearlyLog);

dailyRouter.get("/", DailyController.getDailyLogs);
dailyRouter.post("/", DailyController.createDailyLog);
dailyRouter.get("/:date", DailyController.getDailyLogDetail);
dailyRouter.put("/logs/:logId", DailyController.updateDailyLog);
dailyRouter.post("/tasks", DailyController.createDailyTask);
dailyRouter.put("/tasks/:taskId", DailyController.updateDailyTask);
dailyRouter.delete("/tasks/:taskId", DailyController.deleteDailyTask);

