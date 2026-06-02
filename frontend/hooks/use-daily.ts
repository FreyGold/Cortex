"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDailyLog,
  createDailyTask,
  createHabit,
  deleteDailyTask,
  deleteHabit,
  getDailyLogDetail,
  getDailyLogs,
  getDailyStats,
  getHabitLogs,
  getHabits,
  type HabitItem,
  searchDailyLogs,
  toggleHabitLog,
  updateDailyLog,
  updateDailyTask,
  updateHabit,
  getPomodoroSessions,
  logPomodoroSession,
  getSubjects,
  createSubject,
  deleteSubject,
  getGroups,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  getLeaderboard,
  getGroupLeaderboard,
  getFriendsLeaderboard,
  getUserMonthlyLog,
  getUserYearlyLog,
  createGroupInvitation,
  getGroupInvitations,
  respondToGroupInvitation,
  joinGroupByCode,
  getGroupByInviteCode,
} from "@/lib/api/daily";
import { createClient } from "@/lib/supabase/client";

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to access daily logs.");
  }

  return session.access_token;
}

export function useDailyLogs(
  monthStart: string,
  monthEnd: string,
  workspaceId?: string,
) {
  return useQuery({
    queryKey: ["daily-logs", monthStart, monthEnd, workspaceId],
    queryFn: async () => {
      const token = await getAccessToken();
      return getDailyLogs(token, monthStart, monthEnd, workspaceId);
    },
  });
}

export function useDailyLogDetail(date: string, workspaceId?: string) {
  return useQuery({
    queryKey: ["daily-log", date, workspaceId],
    queryFn: async () => {
      const token = await getAccessToken();
      return getDailyLogDetail(token, date, workspaceId);
    },
    enabled: !!date,
  });
}

export function useCreateDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      workspaceId,
    }: {
      date: string;
      workspaceId?: string;
    }) => {
      const token = await getAccessToken();
      return createDailyLog(token, date, workspaceId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.setQueryData(
        ["daily-log", data.log.date, data.log.workspace_id],
        data,
      );
    },
  });
}

export function useUpdateDailyLog(logId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      rating?: string | null;
      highlight?: string | null;
      content?: any;
      contentText?: string;
    }) => {
      const token = await getAccessToken();
      return updateDailyLog(token, logId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    },
  });
}

export function useCreateDailyTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId, text }: { logId: string; text: string }) => {
      const token = await getAccessToken();
      return createDailyTask(token, logId, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    },
  });
}

export function useUpdateDailyTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { text?: string; is_completed?: boolean; log_id?: string };
    }) => {
      const token = await getAccessToken();
      return updateDailyTask(token, taskId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    },
  });
}

export function useDeleteDailyTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const token = await getAccessToken();
      return deleteDailyTask(token, taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.invalidateQueries({ queryKey: ["daily-log"] });
    },
  });
}

export function useSearchDailyLogs() {
  return useMutation({
    mutationFn: async (query: string) => {
      const token = await getAccessToken();
      return searchDailyLogs(token, query);
    },
  });
}

export function useDailyStats() {
  return useQuery({
    queryKey: ["daily-stats"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getDailyStats(token);
    },
  });
}

// ── Habits Hooks ─────────────────────────────────────────

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getHabits(token);
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      text,
      frequency,
      week_days,
      month_days,
    }: {
      text: string;
      frequency?: HabitItem["frequency"];
      week_days?: string[];
      month_days?: string[];
    }) => {
      const token = await getAccessToken();
      return createHabit(token, text, frequency, week_days, month_days);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      payload,
    }: {
      habitId: string;
      payload: Partial<Pick<HabitItem, "text" | "frequency" | "is_active">>;
    }) => {
      const token = await getAccessToken();
      return updateHabit(token, habitId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (habitId: string) => {
      const token = await getAccessToken();
      return deleteHabit(token, habitId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useHabitLogs(start: string, end: string) {
  return useQuery({
    queryKey: ["habit-logs", start, end],
    queryFn: async () => {
      const token = await getAccessToken();
      return getHabitLogs(token, start, end);
    },
    enabled: !!start && !!end,
  });
}

export function useToggleHabitLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => {
      const token = await getAccessToken();
      return toggleHabitLog(token, habitId, date, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit-logs"] });
    },
  });
}

// ── Pomodoro Hooks ─────────────────────────────────────────

export function usePomodoroSessions(date: string) {
  return useQuery({
    queryKey: ["pomodoro-sessions", date],
    queryFn: async () => {
      const token = await getAccessToken();
      return getPomodoroSessions(token, date);
    },
    enabled: !!date,
  });
}

export function useLogPomodoroSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      duration,
      type,
      startTime,
      endTime,
      subjectId,
      actualDurationSeconds,
      logId,
      notes,
    }: {
      duration: number;
      type: string;
      startTime: string;
      endTime: string;
      subjectId?: string;
      actualDurationSeconds?: number;
      logId?: string;
      notes?: string;
    }) => {
      const token = await getAccessToken();
      return logPomodoroSession(token, duration, type, startTime, endTime, subjectId, actualDurationSeconds, logId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pomodoro-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["daily-stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["friends-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["group-leaderboard"] });
    },
  });
}

export function useUserSubjects() {
  return useQuery({
    queryKey: ["user-subjects"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getSubjects(token);
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const token = await getAccessToken();
      return createSubject(token, name, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subjects"] });
    },
  });
}

// ── Social Hooks ──────────────────────────────────────────

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getGroups(token);
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const token = await getAccessToken();
      return createGroup(token, name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: string) => {
      const token = await getAccessToken();
      return deleteGroup(token, groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

function useAddGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, email }: { groupId: string; email: string }) => {
      const token = await getAccessToken();
      return addGroupMember(token, groupId, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, memberUserId }: { groupId: string; memberUserId: string }) => {
      const token = await getAccessToken();
      return removeGroupMember(token, groupId, memberUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useCreateGroupInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, email }: { groupId: string; email: string }) => {
      const token = await getAccessToken();
      return createGroupInvitation(token, groupId, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

function useGetGroupInvitations(groupId: string | null) {
  return useQuery({
    queryKey: ["group-invitations", groupId],
    queryFn: async () => {
      const token = await getAccessToken();
      return getGroupInvitations(token, groupId!);
    },
    enabled: !!groupId,
  });
}

function useRespondToGroupInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: string; status: "accepted" | "rejected" }) => {
      const token = await getAccessToken();
      return respondToGroupInvitation(token, invitationId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinGroupByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const token = await getAccessToken();
      return joinGroupByCode(token, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

function useGetGroupByInviteCode(code: string | null) {
  return useQuery({
    queryKey: ["group-lookup", code],
    queryFn: async () => {
      const token = await getAccessToken();
      return getGroupByInviteCode(token, code!);
    },
    enabled: !!code,
  });
}

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getFriends(token);
    },
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ["friend-requests"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getFriendRequests(token);
    },
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const token = await getAccessToken();
      return sendFriendRequest(token, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: "accepted" | "rejected" }) => {
      const token = await getAccessToken();
      return respondToFriendRequest(token, requestId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      const token = await getAccessToken();
      return removeFriend(token, friendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getLeaderboard(token);
    },
    refetchInterval: 60_000,
  });
}

export function useGroupLeaderboard(groupId: string | null) {
  return useQuery({
    queryKey: ["group-leaderboard", groupId],
    queryFn: async () => {
      const token = await getAccessToken();
      return getGroupLeaderboard(token, groupId!);
    },
    enabled: !!groupId,
    refetchInterval: 60_000,
  });
}

export function useFriendsLeaderboard() {
  return useQuery({
    queryKey: ["friends-leaderboard"],
    queryFn: async () => {
      const token = await getAccessToken();
      return getFriendsLeaderboard(token);
    },
    refetchInterval: 60_000,
  });
}

export function useUserMonthlyLog(userId: string, year: number, month: number) {
  return useQuery({
    queryKey: ["user-monthly-log", userId, year, month],
    queryFn: async () => {
      const token = await getAccessToken();
      return getUserMonthlyLog(token, userId, year, month);
    },
    enabled: !!userId && !!year && !!month,
  });
}

export function useUserYearlyLog(userId: string, year: number) {
  return useQuery({
    queryKey: ["user-yearly-log", userId, year],
    queryFn: async () => {
      const token = await getAccessToken();
      return getUserYearlyLog(token, userId, year);
    },
    enabled: !!userId && !!year,
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subjectId: string) => {
      const token = await getAccessToken();
      return deleteSubject(token, subjectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["pomodoro-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["daily-stats"] });
    },
  });
}
