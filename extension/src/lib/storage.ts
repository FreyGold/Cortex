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

export async function getAuth(): Promise<AuthState | null> {
  await chrome.storage.local.remove(KEYS.AUTH);
  const result = await chrome.storage.session.get(KEYS.AUTH);
  return (result[KEYS.AUTH] as AuthState | undefined) ?? null;
}

export async function setAuth(auth: AuthState): Promise<void> {
  await chrome.storage.local.remove(KEYS.AUTH);
  await chrome.storage.session.set({ [KEYS.AUTH]: auth });
}

export async function clearAuth(): Promise<void> {
  await Promise.all([chrome.storage.local.remove(KEYS.AUTH), chrome.storage.session.remove(KEYS.AUTH)]);
}

// ── Timer ─────────────────────────────────────────────────

export function getTimer(): Promise<TimerStorage | null> {
  return get<TimerStorage>(KEYS.TIMER);
}

export function setTimer(timer: TimerStorage): Promise<void> {
  return set(KEYS.TIMER, timer);
}

export function clearTimer(): Promise<void> {
  return remove(KEYS.TIMER);
}

// ── Settings ──────────────────────────────────────────────

const DEFAULT_SETTINGS: ExtensionSettings = {
  backendUrl: "https://cortex-eta-black.vercel.app",
  durations: {
    Focus: 25,
    "Short Break": 5,
    "Long Break": 15,
  },
};

export async function getSettings(): Promise<ExtensionSettings> {
  const s = await get<ExtensionSettings>(KEYS.SETTINGS);
  return s ?? DEFAULT_SETTINGS;
}

export async function setSettings(s: ExtensionSettings): Promise<void> {
  await set(KEYS.SETTINGS, s);
}

// ── Subjects cache ────────────────────────────────────────

export function getSubjectsCache(): Promise<{ subjects: import("./types").PomodoroSubject[]; timestamp: number } | null> {
  return get(KEYS.SUBJECTS_CACHE);
}

export function setSubjectsCache(subjects: import("./types").PomodoroSubject[]): Promise<void> {
  return set(KEYS.SUBJECTS_CACHE, { subjects, timestamp: Date.now() });
}
