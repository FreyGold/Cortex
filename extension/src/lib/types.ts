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
  subject_id: string | null;
  actual_duration_seconds: number | null;
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

export type TimerMode = "Focus" | "Short Break" | "Long Break";

export type TimerState =
  | { phase: "idle" }
  | {
      phase: "running" | "paused";
      mode: TimerMode;
      duration: number;
      elapsed: number;
      remaining: number;
      startTime: number;
      subjectId: string | null;
      subjectName: string | null;
    }
  | { phase: "completed"; mode: TimerMode; session: PomodoroSession }
  | { phase: "interrupted"; mode: TimerMode; elapsed: number };

export type TimerStorage = {
  state: "running" | "paused";
  mode: TimerMode;
  duration: number;
  startTime: number;
  elapsed: number;
  subjectId: string | null;
  subjectName: string | null;
};

export type AuthState = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
};

export type ExtensionSettings = {
  backendUrl: string;
  durations: Record<TimerMode, number>;
};

export type PopupMessage =
  | { action: "START"; mode: TimerMode; duration: number; subjectId: string | null; subjectName: string | null }
  | { action: "STOP" }
  | { action: "GET_STATE" }
  | { action: "AUTH_UPDATED"; auth: AuthState }
  | { action: "LOGOUT" };

export type GroupItem = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  group_members?: GroupMemberItem[];
};

export type GroupMemberItem = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
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

export type WorkerResponse =
  | { type: "STATE"; state: TimerState }
  | { type: "TICK"; remaining: number; elapsed: number }
  | { type: "COMPLETED"; session: PomodoroSession }
  | { type: "INTERRUPTED"; elapsed: number }
  | { type: "ERROR"; message: string };
