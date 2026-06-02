import { apiRequest } from "./client";

export type DailyTaskItem = {
  id: string;
  log_id: string;
  text: string;
  is_completed: boolean;
  habit_id: string | null;
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
  pomodoro_sessions?: PomodoroSession[];
};

export type HabitItem = {
  id: string;
  user_id: string;
  text: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  week_days: string[];
  month_days: string[];
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

export type PomodoroSession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  completed: boolean;
  type: string;
  log_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PomodoroSubject = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export function getDailyLogs(
  accessToken: string,
  monthStart: string,
  monthEnd: string,
  workspaceId?: string,
) {
  const ts = Date.now();
  let url = `/api/daily?start=${monthStart}&end=${monthEnd}&_t=${ts}`;
  if (workspaceId) {
    url += `&workspaceId=${workspaceId}`;
  }
  return apiRequest<{ logs: DailyLogItem[] }>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getDailyLogDetail(
  accessToken: string,
  date: string,
  workspaceId?: string,
) {
  let url = `/api/daily/${date}`;
  if (workspaceId) url += `?workspaceId=${workspaceId}`;
  return apiRequest<{ log: DailyLogItem }>(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createDailyLog(
  accessToken: string,
  date: string,
  workspaceId?: string,
) {
  return apiRequest<{ log: DailyLogItem }>("/api/daily", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { date, workspaceId },
  });
}

export function updateDailyLog(
  accessToken: string,
  logId: string,
  payload: {
    rating?: string | null;
    highlight?: string | null;
    content?: any;
    contentText?: string;
  },
) {
  return apiRequest<{ success: boolean }>(`/api/daily/logs/${logId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function createDailyTask(
  accessToken: string,
  logId: string,
  text: string,
) {
  return apiRequest<{ task: DailyTaskItem }>("/api/daily/tasks", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { logId, text },
  });
}

export function updateDailyTask(
  accessToken: string,
  taskId: string,
  payload: { text?: string; is_completed?: boolean; log_id?: string },
) {
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
  frequency: HabitItem["frequency"] = "Daily",
  week_days: string[] = [],
  month_days: string[] = [],
) {
  return apiRequest<{ habit: HabitItem }>("/api/daily/habits", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { text, frequency, week_days, month_days },
  });
}

export function updateHabit(
  accessToken: string,
  habitId: string,
  payload: Partial<Pick<HabitItem, "text" | "frequency" | "is_active">>,
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

export function getHabitLogs(accessToken: string, start: string, end: string) {
  return apiRequest<{ logs: HabitLogItem[] }>(
    `/api/daily/habit-logs?start=${start}&end=${end}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export function toggleHabitLog(
  accessToken: string,
  habitId: string,
  date: string,
  completed: boolean,
) {
  return apiRequest<{ success: boolean }>(`/api/daily/habits/${habitId}/logs`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { date, completed },
  });
}

// ── Pomodoro ────────────────────────────────────────────

export function getSubjects(accessToken: string) {
  return apiRequest<{ subjects: PomodoroSubject[] }>("/api/daily/subjects", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createSubject(accessToken: string, name: string, color?: string) {
  return apiRequest<{ subject: PomodoroSubject }>("/api/daily/subjects", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { name, color },
  });
}

export function deleteSubject(accessToken: string, subjectId: string) {
  return apiRequest<{ success: boolean }>(`/api/daily/subjects/${subjectId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function logPomodoroSession(
  accessToken: string,
  duration: number,
  type: string,
  startTime: string,
  endTime: string,
  subjectId?: string,
  actualDurationSeconds?: number,
  logId?: string,
  notes?: string,
) {
  return apiRequest<{ session: PomodoroSession }>("/api/daily/pomodoro", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { duration, type, startTime, endTime, subjectId, actualDurationSeconds, logId, notes, completed: true },
  });
}

export function getPomodoroSessions(accessToken: string, date: string) {
  return apiRequest<{ sessions: PomodoroSession[] }>(
    `/api/daily/pomodoro?date=${date}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

// ── Social Types ──────────────────────────────────────────

export type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  invite_code?: string;
  group_members?: GroupMemberItem[];
};

export type GroupMemberItem = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { id: string; email: string; name?: string };
};

export type GroupInvitationItem = {
  id: string;
  group_id: string;
  invited_email: string;
  invited_by: string;
  invited_user_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type FriendItem = {
  id: string;
  friend: { id: string; email: string };
  created_at: string;
};

export type FriendRequestItem = {
  id: string;
  sender_id: string;
  recipient_email: string;
  recipient_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  email: string;
  name: string;
  total_seconds: number;
};

export type MonthlyLogEntry = {
  date: string;
  total_seconds: number;
  session_count: number;
};

// ── Groups ──────────────────────────────────────────────

export function getGroups(accessToken: string) {
  return apiRequest<{ groups: GroupItem[] }>("/api/daily/groups", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createGroup(accessToken: string, name: string, description?: string) {
  return apiRequest<{ group: GroupItem }>("/api/daily/groups", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { name, description },
  });
}

function updateGroup(accessToken: string, groupId: string, payload: Record<string, any>) {
  return apiRequest<{ success: boolean }>(`/api/daily/groups/${groupId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function deleteGroup(accessToken: string, groupId: string) {
  return apiRequest<{ success: boolean }>(`/api/daily/groups/${groupId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

function getGroupMembers(accessToken: string, groupId: string) {
  return apiRequest<{ members: GroupMemberItem[] }>(`/api/daily/groups/${groupId}/members`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function addGroupMember(accessToken: string, groupId: string, email: string) {
  return apiRequest<{ member: GroupMemberItem }>(`/api/daily/groups/${groupId}/members`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { email },
  });
}

export function removeGroupMember(accessToken: string, groupId: string, memberUserId: string) {
  return apiRequest<{ success: boolean }>(`/api/daily/groups/${groupId}/members/${memberUserId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createGroupInvitation(accessToken: string, groupId: string, email: string) {
  return apiRequest<{ invitation: GroupInvitationItem }>(`/api/daily/groups/${groupId}/invitations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { email },
  });
}

export function getGroupInvitations(accessToken: string, groupId: string) {
  return apiRequest<{ invitations: GroupInvitationItem[] }>(`/api/daily/groups/${groupId}/invitations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function respondToGroupInvitation(accessToken: string, invitationId: string, status: "accepted" | "rejected") {
  return apiRequest<{ success: boolean }>(`/api/daily/group-invitations/${invitationId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { status },
  });
}

export function joinGroupByCode(accessToken: string, code: string) {
  return apiRequest<{ member: GroupMemberItem }>("/api/daily/groups/join", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { code },
  });
}

export function getGroupByInviteCode(accessToken: string, code: string) {
  return apiRequest<{ group: GroupItem }>(`/api/daily/groups/lookup/${code}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ── Friends ────────────────────────────────────────────

export function getFriends(accessToken: string) {
  return apiRequest<{ friends: FriendItem[] }>("/api/daily/friends", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getFriendRequests(accessToken: string) {
  return apiRequest<{ requests: FriendRequestItem[] }>("/api/daily/friend-requests", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function sendFriendRequest(accessToken: string, email: string) {
  return apiRequest<{ request: FriendRequestItem }>("/api/daily/friend-requests", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { email },
  });
}

export function respondToFriendRequest(accessToken: string, requestId: string, status: "accepted" | "rejected") {
  return apiRequest<{ success: boolean }>(`/api/daily/friend-requests/${requestId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { status },
  });
}

function cancelFriendRequest(accessToken: string, requestId: string) {
  return apiRequest<{ success: boolean }>(`/api/daily/friend-requests/${requestId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function removeFriend(accessToken: string, friendId: string) {
  return apiRequest<{ success: boolean }>(`/api/daily/friends/${friendId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ── Leaderboard ────────────────────────────────────────

export function getLeaderboard(accessToken: string) {
  return apiRequest<{ leaderboard: LeaderboardEntry[] }>("/api/daily/leaderboard", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getGroupLeaderboard(accessToken: string, groupId: string) {
  return apiRequest<{ leaderboard: LeaderboardEntry[] }>(`/api/daily/leaderboard/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getFriendsLeaderboard(accessToken: string) {
  return apiRequest<{ leaderboard: LeaderboardEntry[] }>("/api/daily/leaderboard/friends", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function getUserMonthlyLog(accessToken: string, userId: string, year: number, month: number) {
  return apiRequest<{ log: MonthlyLogEntry[] }>(
    `/api/daily/users/${userId}/monthly-log?year=${year}&month=${month}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}

export function getUserYearlyLog(accessToken: string, userId: string, year: number) {
  return apiRequest<{ log: MonthlyLogEntry[] }>(
    `/api/daily/users/${userId}/yearly-log?year=${year}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}
