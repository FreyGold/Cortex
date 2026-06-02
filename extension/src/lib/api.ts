import { getAuth, setAuth } from "./storage";
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
  return s.ckh_settings?.backendUrl ?? "http://localhost:4000";
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

async function ensureValidAuth(): Promise<AuthState | null> {
  const auth = await getAuth();
  if (!auth) return null;
  if (!auth.refreshToken) return auth;
  if (!isTokenExpired(auth.accessToken)) return auth;

  try {
    const baseUrl = await getBackendUrl();
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    if (!res.ok) return auth;
    const data = await res.json();
    if (!data.session) return auth;

    const updated: AuthState = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token ?? auth.refreshToken,
      user: data.user ?? auth.user,
    };
    await setAuth(updated);
    return updated;
  } catch {
    return auth;
  }
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

// ── Auth ──────────────────────────────────────────────────

function login(email: string, password: string) {
  return apiRequest<{ user: { id: string; email: string }; session: { access_token: string; refresh_token: string }; message: string }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

function signup(email: string, password: string, fullName: string) {
  return apiRequest<{ user: { id: string; email: string }; session: { access_token: string; refresh_token: string } | null; message: string }>(
    "/api/auth/signup",
    { method: "POST", body: JSON.stringify({ email, password, fullName }) }
  );
}

// ── Subjects ──────────────────────────────────────────────

function getSubjects(): Promise<{ subjects: PomodoroSubject[] }> {
  return apiRequest("/api/daily/subjects");
}

function createSubject(name: string, color?: string): Promise<{ subject: PomodoroSubject }> {
  return apiRequest("/api/daily/subjects", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

// ── Pomodoro ──────────────────────────────────────────────

function logPomodoroSession(params: {
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

function getPomodoroSessions(date: string): Promise<{ sessions: PomodoroSession[] }> {
  return apiRequest(`/api/daily/pomodoro?date=${date}`);
}

// ── Social API ───────────────────────────────────────────

function getGroups(): Promise<{ groups: GroupItem[] }> {
  return apiRequest("/api/daily/groups");
}

function createGroup(name: string, description?: string): Promise<{ group: GroupItem }> {
  return apiRequest("/api/daily/groups", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

function deleteGroup(groupId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/groups/${groupId}`, { method: "DELETE" });
}

function addGroupMember(groupId: string, email: string): Promise<{ member: GroupMemberItem }> {
  return apiRequest(`/api/daily/groups/${groupId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

function removeGroupMember(groupId: string, memberUserId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/groups/${groupId}/members/${memberUserId}`, { method: "DELETE" });
}

function getFriends(): Promise<{ friends: FriendItem[] }> {
  return apiRequest("/api/daily/friends");
}

function getFriendRequests(): Promise<{ requests: FriendRequestItem[] }> {
  return apiRequest("/api/daily/friend-requests");
}

function sendFriendRequest(email: string): Promise<{ request: FriendRequestItem }> {
  return apiRequest("/api/daily/friend-requests", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

function respondToFriendRequest(requestId: string, status: "accepted" | "rejected"): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/friend-requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

function removeFriend(friendId: string): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/friends/${friendId}`, { method: "DELETE" });
}

function getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest("/api/daily/leaderboard");
}

function getFriendsLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest("/api/daily/leaderboard/friends");
}

function getGroupLeaderboard(groupId: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
  return apiRequest(`/api/daily/leaderboard/groups/${groupId}`);
}

function createGroupInvitation(groupId: string, email: string): Promise<{ invitation: any }> {
  return apiRequest(`/api/daily/groups/${groupId}/invitations`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

function getGroupInvitations(groupId: string): Promise<{ invitations: any[] }> {
  return apiRequest(`/api/daily/groups/${groupId}/invitations`);
}

function respondToGroupInvitation(invitationId: string, status: "accepted" | "rejected"): Promise<{ success: boolean }> {
  return apiRequest(`/api/daily/group-invitations/${invitationId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

function joinGroupByCode(code: string): Promise<{ member: any }> {
  return apiRequest("/api/daily/groups/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}
