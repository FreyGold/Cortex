"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { 
  getDailyLogs, 
  getDailyLogDetail, 
  createDailyLog, 
  updateDailyLog, 
  createDailyTask, 
  updateDailyTask, 
  deleteDailyTask,
  searchDailyLogs,
  getDailyStats
} from "@/lib/api/daily";

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

export function useDailyLogs(monthStart: string, monthEnd: string, workspaceId?: string) {
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
    mutationFn: async ({ date, workspaceId }: { date: string; workspaceId?: string }) => {
      const token = await getAccessToken();
      return createDailyLog(token, date, workspaceId);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      queryClient.setQueryData(["daily-log", data.log.date, data.log.workspace_id], data);
    },
  });
}

export function useUpdateDailyLog(logId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { rating?: string | null; highlight?: string | null; content?: any; contentText?: string }) => {
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
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: { text?: string; is_completed?: boolean; log_id?: string } }) => {
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
