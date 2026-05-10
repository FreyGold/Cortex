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

export function useUpdateHabit() {
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
