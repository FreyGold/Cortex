import { apiRequest } from "./client";

export type DailyTaskItem = {
  id: string;
  log_id: string;
  text: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type DailyLogItem = {
  id: string;
  workspace_id: string | null;
  user_id: string;
  date: string;
  rating: string | null;
  highlight: string | null;
  content: any;
  content_text: string | null;
  created_at: string;
  updated_at: string;
  tasks?: DailyTaskItem[];
};

export type HabitItem = {
  id: string;
  user_id: string;
  text: string;
  frequency: "Daily" | "Weekdays" | "Weekends" | "Custom";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type HabitLogItem = {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
};

export function getDailyLogs(accessToken: string, monthStart: string, monthEnd: string, workspaceId?: string) {
  const ts = Date.now();
  let url = `/api/daily?start=${monthStart}&end=${monthEnd}&_t=${ts}`;
  if (workspaceId) {
    url += `&workspaceId=${workspaceId}`;
  }
  return apiRequest<{ logs: DailyLogItem[] }>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getDailyLogDetail(accessToken: string, date: string, workspaceId?: string) {
  let url = `/api/daily/${date}`;
  if (workspaceId) url += `?workspaceId=${workspaceId}`;
  return apiRequest<{ log: DailyLogItem }>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createDailyLog(accessToken: string, date: string, workspaceId?: string) {
  return apiRequest<{ log: DailyLogItem }>("/api/daily", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { date, workspaceId },
  });
}

export function updateDailyLog(
  accessToken: string,
  logId: string,
  payload: { rating?: string | null; highlight?: string | null; content?: any; contentText?: string }
) {
  return apiRequest<{ success: boolean }>(`/api/daily/logs/${logId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function createDailyTask(accessToken: string, logId: string, text: string) {
  return apiRequest<{ task: DailyTaskItem }>("/api/daily/tasks", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { logId, text },
  });
}

export function updateDailyTask(accessToken: string, taskId: string, payload: { text?: string; is_completed?: boolean; log_id?: string }) {
  return apiRequest<{ success: boolean }>(`/api/daily/tasks/${taskId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function deleteDailyTask(accessToken: string, taskId: string) {
  return apiRequest<{ success: boolean }>(`/api/daily/tasks/${taskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function searchDailyLogs(accessToken: string, query: string) {
  return apiRequest<{ results: any[] }>("/api/daily/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { query },
  });
}

export function getDailyStats(accessToken: string) {
  return apiRequest<{ stats: any }>("/api/daily/stats", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ── Habits ──────────────────────────────────────────────

export function getHabits(accessToken: string) {
  return apiRequest<{ habits: HabitItem[] }>("/api/daily/habits", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createHabit(
  accessToken: string,
  text: string,
  frequency: HabitItem["frequency"] = "Daily"
) {
  return apiRequest<{ habit: HabitItem }>("/api/daily/habits", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { text, frequency },
  });
}

export function updateHabit(
  accessToken: string,
  habitId: string,
  payload: Partial<Pick<HabitItem, "text" | "frequency" | "is_active">>
) {
  return apiRequest<{ success: boolean }>(`/api/daily/habits/${habitId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function deleteHabit(accessToken: string, habitId: string) {
  return apiRequest<{ success: boolean }>(`/api/daily/habits/${habitId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getHabitLogs(
  accessToken: string,
  start: string,
  end: string
) {
  return apiRequest<{ logs: HabitLogItem[] }>(
    `/api/daily/habit-logs?start=${start}&end=${end}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

export function toggleHabitLog(
  accessToken: string,
  habitId: string,
  date: string,
  completed: boolean
) {
  return apiRequest<{ success: boolean }>(
    `/api/daily/habits/${habitId}/logs`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { date, completed },
    }
  );
}
