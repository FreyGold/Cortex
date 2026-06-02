import { getAuth, clearAuth, setSubjectsCache } from "../lib/storage";
import * as authLib from "../lib/auth";
import { createSubject } from "../lib/api";
import type { AuthState, TimerState, WorkerResponse, TimerMode } from "../lib/types";
import { renderTimerTab, loadSubjects } from "./components/timer-tab";
import { renderHistoryTab } from "./components/history-tab";
import { renderSettingsTab } from "./components/settings-tab";
import { renderBlockerTab } from "./components/blocker-tab";
import { renderSocialTab } from "./components/social-tab";
import * as blocker from "../lib/blocker";
import { formatTime } from "../lib/format";

// ── State ─────────────────────────────────────────────────

let currentAuth: AuthState | null = null;
let currentTab: "timer" | "history" | "blocker" | "settings" | "social" = "timer";
let timerState: TimerState = { phase: "idle" };
let tickInterval: ReturnType<typeof setInterval> | null = null;

const root = document.getElementById("root")!;

let onStart: (mode: TimerMode, duration: number, subjectId: string | null, subjectName: string | null) => void;
let onStop: () => void;

// ── Init ──────────────────────────────────────────────────

async function init() {
  currentAuth = await getAuth();

  if (currentAuth) {
    await loadSubjects();
    renderApp();
    syncTimerState();
  } else {
    renderLogin();
  }

  listenForWorkerMessages();
}

// ── Listen for service worker messages ────────────────────

function listenForWorkerMessages() {
  chrome.runtime.onMessage.addListener((msg: WorkerResponse) => {
    if (msg.type === "STATE") {
      timerState = msg.state;
      if (currentTab === "timer") {
        renderTimerTabContent();
        startLocalTick();
      }
    } else if (msg.type === "COMPLETED") {
      timerState = { phase: "completed", mode: (timerState as any).mode ?? "Focus", session: msg.session };
      stopLocalTick();
      if (currentTab === "timer") renderTimerTabContent();
    } else if (msg.type === "INTERRUPTED") {
      timerState = { phase: "idle" };
      stopLocalTick();
      if (currentTab === "timer") renderTimerTabContent();
    }
  });
}

async function syncTimerState() {
  try {
    const response: WorkerResponse = await chrome.runtime.sendMessage({ action: "GET_STATE" });
    if (response?.type === "STATE") {
      timerState = response.state;
      if (currentTab === "timer") {
        renderTimerTabContent();
        if (timerState.phase === "running") startLocalTick();
      }
    }
  } catch {
    // SW not ready
  }
}

// ── Live countdown (local setInterval) ────────────────────

function startLocalTick() {
  stopLocalTick();
  if (timerState.phase !== "running") return;

  if (timerState.phase !== "running") return;
  const startTime = timerState.startTime;
  const duration = timerState.duration;

  tickInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, duration * 60 - elapsed);

    if (timerState.phase === "running") {
      timerState = { ...timerState, remaining, elapsed };
    }

    const display = document.getElementById("timer-display");
    if (display) display.textContent = formatTime(remaining);

    if (remaining <= 0) {
      stopLocalTick();
      timerState = { phase: "idle" };
    }
  }, 200);
}

function stopLocalTick() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

// ── Tab switching cleanup ─────────────────────────────────

function switchTab(tab: typeof currentTab) {
  currentTab = tab;
  stopLocalTick();
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tab);
  });
  renderTabContent();
  if (tab === "timer" && timerState.phase === "running") startLocalTick();
}

// ── Login Screen ──────────────────────────────────────────

function renderLogin() {
  root.innerHTML = `
    <div class="login-screen">
      <h1>College Knowledge Hub</h1>
      <p>Sign in to track your focus sessions</p>
      <form class="login-form" id="login-form">
        <input type="email" id="login-email" placeholder="Email" required autocomplete="email" />
        <input type="password" id="login-password" placeholder="Password" required autocomplete="current-password" />
        <div id="login-error" class="login-error"></div>
        <button type="submit" class="btn btn-primary btn-full btn-lg" id="login-submit">Sign In</button>
      </form>
      <div class="login-divider">or</div>
      <button class="btn btn-google btn-full btn-lg" id="google-login">Sign in with Google</button>
      <p style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">
        No account yet? Sign in to the <a href="#" id="open-webapp" style="color:var(--accent);text-decoration:none;">web app</a> first.
      </p>
    </div>
  `;

  document.getElementById("login-form")!.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("login-email") as HTMLInputElement).value;
    const password = (document.getElementById("login-password") as HTMLInputElement).value;
    const errorEl = document.getElementById("login-error")!;
    const submitBtn = document.getElementById("login-submit") as HTMLButtonElement;

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";
    errorEl.textContent = "";

    try {
      currentAuth = await authLib.loginWithEmail(email, password);
      chrome.runtime.sendMessage({ action: "AUTH_UPDATED", auth: currentAuth }).catch(() => {});
      await loadSubjects();
      renderApp();
    } catch (err: any) {
      errorEl.textContent = err.message ?? "Failed to sign in";
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In";
    }
  });

  document.getElementById("google-login")!.addEventListener("click", async () => {
    const errorEl = document.getElementById("login-error")!;
    try {
      currentAuth = await authLib.loginWithGoogle();
      chrome.runtime.sendMessage({ action: "AUTH_UPDATED", auth: currentAuth }).catch(() => {});
      await loadSubjects();
      renderApp();
    } catch (err: any) {
      errorEl.textContent = err.message ?? "Google sign-in failed";
    }
  });

  document.getElementById("open-webapp")!.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "http://localhost:3000/auth/login" });
  });
}

// ── App Shell ─────────────────────────────────────────────

function renderApp() {
  root.innerHTML = `
    <div class="tab-bar" id="tab-bar">
      <button class="tab-btn active" data-tab="timer">Focus</button>
      <button class="tab-btn" data-tab="history">Log</button>
      <button class="tab-btn" data-tab="social">Social</button>
      <button class="tab-btn" data-tab="blocker">Block</button>
      <button class="tab-btn" data-tab="settings">Settings</button>
    </div>
    <div class="tab-content fade-in" id="tab-content"></div>
  `;

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab") as typeof currentTab;
      switchTab(tab);
    });
  });

  renderTabContent();
  if (timerState.phase === "running") startLocalTick();
}

function renderTabContent() {
  const content = document.getElementById("tab-content")!;
  content.classList.remove("fade-in");
  void content.offsetWidth;
  content.classList.add("fade-in");

  switch (currentTab) {
    case "timer":
      renderTimerTabContent();
      break;
    case "history":
      renderHistoryTabContent();
      break;
    case "blocker":
      renderBlockerTabContent();
      break;
    case "social":
      renderSocialTabContent();
      break;
    case "settings":
      renderSettingsTabContent();
      break;
  }
}

// ── Timer Tab ─────────────────────────────────────────────

function renderTimerTabContent() {
  const content = document.getElementById("tab-content")!;

  onStart = (mode, duration, subjectId, subjectName) => {
    chrome.runtime.sendMessage({ action: "START", mode, duration, subjectId, subjectName }, (response: WorkerResponse) => {
      if (response?.type === "STATE") {
        timerState = response.state;
        renderTimerTabContent();
        startLocalTick();
      }
    });
  };

  onStop = () => {
    stopLocalTick();
    chrome.runtime.sendMessage({ action: "STOP" }, (response: WorkerResponse) => {
      if (response?.type === "STATE") {
        timerState = response.state;
        renderTimerTabContent();
      }
    });
  };

  content.innerHTML = renderTimerTab(timerState);
  attachTimerEvents();
}

function attachTimerEvents() {
  document.querySelectorAll(".timer-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-mode") as TimerMode;
      document.querySelectorAll(".timer-mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateTimerForMode(mode);
    });
  });

  document.getElementById("timer-start")?.addEventListener("click", () => {
    const modeEl = document.querySelector(".timer-mode-btn.active") as HTMLElement;
    const mode = modeEl?.getAttribute("data-mode") as TimerMode;
    const duration = parseInt(modeEl?.dataset?.duration ?? "25");
    const select = document.getElementById("subject-select") as HTMLSelectElement;
    const subjectId = select?.value || null;
    const subjectName = subjectId
      ? select.options[select.selectedIndex]?.textContent?.trim() ?? null
      : null;

    onStart(mode, duration, subjectId, subjectName);
  });

  document.getElementById("timer-stop")?.addEventListener("click", () => {
    onStop();
  });

  document.getElementById("add-subject")?.addEventListener("click", async () => {
    const name = prompt("Subject name:");
    if (!name || !name.trim()) return;
    try {
      await createSubject(name.trim());
      await loadSubjects();
      renderTimerTabContent();
    } catch (err: any) {
      alert(err.message ?? "Failed to create subject");
    }
  });
}

function updateTimerForMode(mode: TimerMode) {
  const raw = localStorage.getItem("ckh_durations");
  const durations: Record<string, number> = raw ? JSON.parse(raw) : {
    Focus: 25,
    "Short Break": 5,
    "Long Break": 15,
  };
  const minutes = durations[mode] ?? 25;
  const display = document.getElementById("timer-display");
  if (display) display.textContent = formatTime(minutes * 60);
}

// ── History Tab ───────────────────────────────────────────

function renderHistoryTabContent() {
  const content = document.getElementById("tab-content")!;
  content.innerHTML = `<div class="loading-screen"><div class="spinner"></div></div>`;
  renderHistoryTab(content).catch(() => {});
}

// ── Social Tab ────────────────────────────────────────────

function renderSocialTabContent() {
  const content = document.getElementById("tab-content")!;
  content.innerHTML = `<div class="loading-screen"><div class="spinner"></div></div>`;
  renderSocialTab(content);
}

// ── Blocker Tab ───────────────────────────────────────────

let blockerState: blocker.BlockerState = { enabled: false, greenlist: [] };

async function renderBlockerTabContent() {
  const content = document.getElementById("tab-content")!;
  blockerState = await blocker.getBlockerState();
  content.innerHTML = renderBlockerTab(blockerState);
  attachBlockerEvents();
}

function attachBlockerEvents() {
  document.getElementById("blocker-toggle")?.addEventListener("click", async () => {
    const newState = await blocker.toggleBlocker();
    blockerState = newState;
    renderBlockerTabContent();
  });

  document.getElementById("blocker-add-domain")?.addEventListener("click", async () => {
    const input = document.getElementById("blocker-domain-input") as HTMLInputElement;
    const domain = input.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!domain) return;

    if (blockerState.greenlist.includes(domain)) {
      input.value = "";
      return;
    }

    const updated = [...blockerState.greenlist, domain];
    await blocker.updateGreenlist(updated);
    blockerState = { ...blockerState, greenlist: updated };
    renderBlockerTabContent();
  });

  document.querySelectorAll(".blocker-domain-remove").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = parseInt((btn as HTMLElement).dataset.index ?? "");
      const updated = blockerState.greenlist.filter((_, i) => i !== idx);
      await blocker.updateGreenlist(updated);
      blockerState = { ...blockerState, greenlist: updated };
      renderBlockerTabContent();
    });
  });

  document.getElementById("blocker-domain-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      (document.getElementById("blocker-add-domain") as HTMLButtonElement)?.click();
    }
  });
}

// ── Settings Tab ──────────────────────────────────────────

async function renderSettingsTabContent() {
  const content = document.getElementById("tab-content")!;

  const raw = localStorage.getItem("ckh_durations");
  const storedDurations: Record<string, number> = raw ? JSON.parse(raw) : {
    Focus: 25,
    "Short Break": 5,
    "Long Break": 15,
  };
  const s = await chrome.storage.local.get("ckh_settings") as { ckh_settings?: { backendUrl?: string } };
  const backendUrl = s.ckh_settings?.backendUrl ?? "http://localhost:4000";

  const onLogout = async () => {
    stopLocalTick();
    await clearAuth();
    chrome.runtime.sendMessage({ action: "LOGOUT" }).catch(() => {});
    currentAuth = null;
    timerState = { phase: "idle" };
    renderLogin();
  };

  content.innerHTML = renderSettingsTab(currentAuth!, {
    backendUrl,
    durations: storedDurations,
  }, onLogout);
  attachSettingsEvents(onLogout);
}

function attachSettingsEvents(onLogout: () => Promise<void>) {
  document.getElementById("settings-logout")?.addEventListener("click", async () => {
    const btn = document.getElementById("settings-logout") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Signing out...";
    await onLogout();
  });

  document.getElementById("settings-save")?.addEventListener("click", async () => {
    const backendUrl = (document.getElementById("settings-backend-url") as HTMLInputElement).value;
    const focus = parseInt((document.getElementById("duration-focus") as HTMLInputElement).value);
    const shortBreak = parseInt((document.getElementById("duration-short") as HTMLInputElement).value);
    const longBreak = parseInt((document.getElementById("duration-long") as HTMLInputElement).value);

    const settings = {
      backendUrl,
      durations: {
        Focus: focus || 25,
        "Short Break": shortBreak || 5,
        "Long Break": longBreak || 15,
      },
    };

    localStorage.setItem("ckh_durations", JSON.stringify(settings.durations));
    await chrome.storage.local.set({ ckh_settings: settings });

    const btn = document.getElementById("settings-save") as HTMLButtonElement;
    const original = btn.textContent;
    btn.textContent = "Saved!";
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}

// ── Boot ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
