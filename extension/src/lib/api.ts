import { ensureValidAuth } from "./auth";
import type { AuthState, PomodoroSession, PomodoroSubject, GroupItem, GroupMemberItem, FriendItem, FriendRequestItem, LeaderboardEntry } from "./types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function getBackendUrl(): Promise<string> {
  const s = await chrome.storage.local.get("ckh_settings") as { ckh_settings?: { backendUrl?: string } };
  return s.ckh_settings?.backendUrl ?? "https://cortex-eta-black.vercel.app";
}


async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = await ensureValidAuth();
  const baseUrl = await getBackendUrl();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth?.accessToken) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = payload?.error ?? payload?.message ?? `Request failed (${response.status})`;
    throw new ApiError(msg, response.status);
  }

  return payload as T;
}

// ── Subjects ──────────────────────────────────────────────

export function getSubjects(): Promise<{ subjects: PomodoroSubject[] }> {
  return apiRequest("/api/daily/subjects");
}

export function createSubject(name: string, color?: string): Promise<{ subject: PomodoroSubject }> {
  return apiRequest("/api/daily/subjects", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

// ── Pomodoro ──────────────────────────────────────────────

export function logPomodoroSession(params: {
  duration: number;
  type: string;
  startTime: string;
  endTime: string;
  subjectId?: string;
  actualDurationSeconds?: number;
  completed: boolean;
}): Promise<{ session: PomodoroSession }> {
  return apiRequest("/api/daily/pomodoro", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getPomodoroSessions(date: string): Promise<{ sessions: PomodoroSession[] }> {
  return apiRequest(`/api/daily/pomodoro?date=${date}`);
}

// ── Social API ───────────────────────────────────────────

export function getGroups(): Promise<{ groups: GroupItem[] }> {
  return apiRequest("/api/daily/groups");
}

export function createGroup(name: string, description?: string): Promise<{ group: GroupItem }> {
  return apiRequest("/api/daily/groups", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export function deleteGroup(groupId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/groups/${groupId}`, { method: "DELETE" });
}

export function addGroupMember(groupId: string, email: string): Promise<{ member: GroupMemberItem }> {
  return apiRequest(`/api/daily/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function removeGroupMember(groupId: string, memberUserId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/groups/${groupId}/members/${memberUserId}`, { method: "DELETE" });
}

export function getFriends(): Promise<{ friends: FriendItem[] }> {
  return apiRequest("/api/daily/friends");
}

export function getFriendRequests(): Promise<{ requests: FriendRequestItem[] }> {
  return apiRequest("/api/daily/friend-requests");
}

export function sendFriendRequest(email: string): Promise<{ request: FriendRequestItem }> {
  return apiRequest("/api/daily/friend-requests", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function respondToFriendRequest(requestId: string, status: "accepted" | "rejected"): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/friend-requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function removeFriend(friendId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/friends/${friendId}`, { method: "DELETE" });
}

export function getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest("/api/daily/leaderboard");
}

export function getFriendsLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest("/api/daily/leaderboard/friends");
}

export function getGroupLeaderboard(groupId: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest(`/api/daily/leaderboard/groups/${groupId}`);
}

export function createGroupInvitation(groupId: string, email: string): Promise<{ invitation: any }> {
  return apiRequest(`/api/daily/groups/${groupId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getGroupInvitations(groupId: string): Promise<{ invitations: any[] }> {
  return apiRequest(`/api/daily/groups/${groupId}/invitations`);
}

export function respondToGroupInvitation(invitationId: string, status: "accepted" | "rejected"): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/group-invitations/${invitationId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export function joinGroupByCode(code: string): Promise<{ member: any }> {
  return apiRequest("/api/daily/groups/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
