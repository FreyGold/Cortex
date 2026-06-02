import type { AuthState, ExtensionSettings, TimerStorage } from "./types";

const KEYS = {
  AUTH: "ckh_auth",
  TIMER: "ckh_timer",
  SETTINGS: "ckh_settings",
  SUBJECTS_CACHE: "ckh_subjects_cache",
} as const;

// ── Generic helpers ──────────────────────────────────────

async function get<T>(key: string): Promise<T | null> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? null;
}

async function set<T>(key: string, value: T): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

async function remove(key: string): Promise<void> {
  await chrome.storage.local.remove(key);
}

// ── Auth ──────────────────────────────────────────────────

function getAuth(): Promise<AuthState | null> {
  return get<AuthState>(KEYS.AUTH);
}

function setAuth(auth: AuthState): Promise<void> {
  return set(KEYS.AUTH, auth);
}

function clearAuth(): Promise<void> {
  return remove(KEYS.AUTH);
}

// ── Timer ─────────────────────────────────────────────────

function getTimer(): Promise<TimerStorage | null> {
  return get<TimerStorage>(KEYS.TIMER);
}

function setTimer(timer: TimerStorage): Promise<void> {
  return set(KEYS.TIMER, timer);
}

function clearTimer(): Promise<void> {
  return remove(KEYS.TIMER);
}

// ── Settings ──────────────────────────────────────────────

const DEFAULT_SETTINGS: ExtensionSettings = {
  backendUrl: "http://localhost:4000",
  durations: {
    Focus: 25,
    "Short Break": 5,
    "Long Break": 15,
  },
};

async function getSettings(): Promise<ExtensionSettings> {
  const s = await get<ExtensionSettings>(KEYS.SETTINGS);
  return s ?? DEFAULT_SETTINGS;
}

async function setSettings(s: ExtensionSettings): Promise<void> {
  await set(KEYS.SETTINGS, s);
}

// ── Subjects cache ────────────────────────────────────────

function getSubjectsCache(): Promise<{ subjects: import("./types").PomodoroSubject[]; timestamp: number } | null> {
  return get(KEYS.SUBJECTS_CACHE);
}

function setSubjectsCache(subjects: import("./types").PomodoroSubject[]): Promise<void> {
  return set(KEYS.SUBJECTS_CACHE, { subjects, timestamp: Date.now() });
}
