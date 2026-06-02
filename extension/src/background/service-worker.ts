import { getTimer, setTimer, clearTimer, getAuth } from "../lib/storage";
import { logPomodoroSession } from "../lib/api";
import type { TimerMode, TimerStorage, PopupMessage, WorkerResponse, TimerState } from "../lib/types";

const DONE_ALARM = "pomodoro-done";
const SAFE_ALARM = "pomodoro-safety";

// ── Init ──────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  checkForInterruptedSession();
});

chrome.runtime.onStartup.addListener(() => {
  checkForInterruptedSession();
});

async function checkForInterruptedSession() {
  const timer = await getTimer();
  if (timer && timer.state === "running") {
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
    const endTime = new Date(timer.startTime + elapsed * 1000).toISOString();
    const durationElapsed = timer.duration * 60;

    try {
      await logPomodoroSession({
        duration: timer.duration,
        type: timer.mode,
        startTime: new Date(timer.startTime).toISOString(),
        endTime,
        subjectId: timer.subjectId ?? undefined,
        actualDurationSeconds: Math.min(elapsed, durationElapsed),
        completed: elapsed >= durationElapsed,
      });
    } catch {
      // Best-effort — session is lost if backend is unavailable
    }

    await clearTimer();
  }
}

// ── Alarm Handlers ────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === DONE_ALARM) {
    await handleDone();
  } else if (alarm.name === SAFE_ALARM) {
    // Safety net: check if timer should have completed but alarm was delayed
    await handleSafetyCheck();
  }
});

async function handleDone() {
  const timer = await getTimer();
  if (!timer) return;

  const elapsed = Math.min(
    Math.floor((Date.now() - timer.startTime) / 1000),
    timer.duration * 60
  );
  const endTime = new Date().toISOString();

  await clearTimer();
  clearAlarms();

  const auth = await getAuth();
  if (!auth) {
    broadcastToPopups({ type: "INTERRUPTED", elapsed });
    return;
  }

  try {
    const { session } = await logPomodoroSession({
      duration: timer.duration,
      type: timer.mode,
      startTime: new Date(timer.startTime).toISOString(),
      endTime,
      subjectId: timer.subjectId ?? undefined,
      actualDurationSeconds: elapsed,
      completed: true,
    });

    broadcastToPopups({ type: "COMPLETED", session });

    await chrome.notifications.create("pomodoro-done", {
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
      title: `${timer.mode} Complete`,
      message: timer.mode === "Focus"
        ? `Great focus session! (${formatDuration(elapsed)})`
        : `Break over. Ready to focus?`,
      priority: 2,
    });
  } catch (err) {
    broadcastToPopups({ type: "ERROR", message: String(err) });

    await chrome.notifications.create("pomodoro-error", {
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
      title: "Session Log Failed",
      message: "Could not save your session. It will be logged when you reopen the extension.",
      priority: 2,
    });
  }
}

async function handleSafetyCheck() {
  const timer = await getTimer();
  if (!timer || timer.state !== "running") return;

  const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
  if (elapsed >= timer.duration * 60) {
    // Alarm was delayed but timer should have ended
    await handleDone();
  }
}

// ── Message Handling ──────────────────────────────────────

chrome.runtime.onMessage.addListener((msg: PopupMessage, _sender, sendResponse) => {
  switch (msg.action) {
    case "START":
      handleStart(msg).then(sendResponse).catch(sendResponse);
      return true;

    case "STOP":
      handleStop().then(sendResponse).catch(sendResponse);
      return true;

    case "GET_STATE":
      handleGetState().then(sendResponse).catch(sendResponse);
      return true;

    case "LOGOUT":
      handleLogout().then(sendResponse).catch(sendResponse);
      return true;
  }
});

async function handleStart(msg: PopupMessage & { action: "START" }) {
  const timer: TimerStorage = {
    state: "running",
    mode: msg.mode,
    duration: msg.duration,
    startTime: Date.now(),
    elapsed: 0,
    subjectId: msg.subjectId,
    subjectName: msg.subjectName,
  };

  await setTimer(timer);

  chrome.alarms.create(DONE_ALARM, { delayInMinutes: msg.duration });
  chrome.alarms.create(SAFE_ALARM, { delayInMinutes: msg.duration + 1 });

  return {
    type: "STATE" as const,
    state: buildRunningState(timer, msg.duration * 60, 0),
  };
}

async function handleStop() {
  const timer = await getTimer();
  await clearTimer();
  clearAlarms();

  if (timer && timer.state === "running") {
    const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);

    if (elapsed > 15) {
      const auth = await getAuth();
      if (auth) {
        try {
          await logPomodoroSession({
            duration: timer.duration,
            type: timer.mode,
            startTime: new Date(timer.startTime).toISOString(),
            endTime: new Date().toISOString(),
            subjectId: timer.subjectId ?? undefined,
            actualDurationSeconds: elapsed,
            completed: false,
          });
        } catch {
          // Best-effort
        }
      }
    }
  }

  return { type: "STATE" as const, state: { phase: "idle" } as TimerState };
}

async function handleGetState(): Promise<WorkerResponse> {
  const timer = await getTimer();
  if (!timer || timer.state !== "running") {
    return { type: "STATE", state: { phase: "idle" } };
  }

  const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
  const remaining = Math.max(0, timer.duration * 60 - elapsed);

  return {
    type: "STATE",
    state: buildRunningState(timer, remaining, elapsed),
  };
}

async function handleLogout() {
  await clearTimer();
  clearAlarms();
}

// ── Helpers ───────────────────────────────────────────────

function buildRunningState(timer: TimerStorage, remaining: number, elapsed: number): TimerState {
  return {
    phase: "running",
    mode: timer.mode,
    duration: timer.duration,
    elapsed,
    remaining,
    startTime: timer.startTime,
    subjectId: timer.subjectId,
    subjectName: timer.subjectName,
  };
}

function clearAlarms() {
  chrome.alarms.clear(DONE_ALARM).catch(() => {});
  chrome.alarms.clear(SAFE_ALARM).catch(() => {});
}

function broadcastToPopups(response: WorkerResponse) {
  chrome.runtime.sendMessage(response).catch(() => {
    // No popup open — that's fine
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
