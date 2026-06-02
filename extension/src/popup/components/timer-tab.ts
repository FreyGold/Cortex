import type { TimerState, TimerMode, PomodoroSubject } from "../../lib/types";
import { getSubjects } from "../../lib/api";
import { getSubjectsCache, setSubjectsCache } from "../../lib/storage";
import { formatTime } from "../../lib/format";

let cachedSubjects: PomodoroSubject[] = [];

async function loadSubjects(): Promise<PomodoroSubject[]> {
  const cache = await getSubjectsCache();
  if (cache && Date.now() - cache.timestamp < 300_000) {
    cachedSubjects = cache.subjects;
    return cachedSubjects;
  }

  try {
    const { subjects } = await getSubjects();
    cachedSubjects = subjects;
    await setSubjectsCache(subjects);
  } catch {
    cachedSubjects = cache?.subjects ?? [];
  }

  return cachedSubjects;
}

function renderTimerTab(state: TimerState): string {
  const isRunning = state.phase === "running";

  // Get durations from localStorage
  const raw = localStorage.getItem("ckh_durations");
  const durations: Record<string, number> = raw ? JSON.parse(raw) : { Focus: 25, "Short Break": 5, "Long Break": 15 };

  const modes: TimerMode[] = ["Focus", "Short Break", "Long Break"];
  const currentMode: TimerMode = isRunning ? state.mode : "Focus";

  const subjectOptions = cachedSubjects
    .map((s) => {
      const selected = isRunning && state.subjectId === s.id ? "selected" : "";
      return `<option value="${s.id}" ${selected}>${s.name}</option>`;
    })
    .join("");

  const subjectHtml = `
    <div class="timer-subject">
      <select class="subject-select" id="subject-select" ${isRunning ? "disabled" : ""}>
        <option value="">No subject</option>
        ${subjectOptions}
      </select>
      <button class="btn btn-ghost" id="add-subject" style="font-size:18px;padding:4px 8px;" title="Add subject">+</button>
    </div>
  `;

  let timerDisplay: string;
  let startStopHtml: string;

  if (state.phase === "idle") {
    const defaultDuration = durations["Focus"];
    timerDisplay = formatTime(defaultDuration * 60);
    startStopHtml = `<button class="btn btn-primary btn-lg btn-full" id="timer-start">Start</button>`;
  } else if (state.phase === "running") {
    timerDisplay = formatTime(state.remaining);
    startStopHtml = `<button class="btn btn-danger btn-lg btn-full" id="timer-stop">Stop</button>`;
  } else if (state.phase === "completed") {
    timerDisplay = "00:00";
    startStopHtml = `<button class="btn btn-primary btn-lg btn-full" id="timer-start">Start New</button>`;
  } else {
    timerDisplay = "00:00";
    startStopHtml = `<button class="btn btn-primary btn-lg btn-full" id="timer-start">Start</button>`;
  }

  const modeButtons = modes
    .map((m) => {
      const active = m === currentMode ? "active" : "";
      const dur = durations[m] ?? 25;
      const label = m === "Focus" ? "Focus" : m === "Short Break" ? "Short" : "Long";
      return `<button class="timer-mode-btn ${active}" data-mode="${m}" data-duration="${dur}" ${isRunning ? "disabled" : ""}>${label}</button>`;
    })
    .join("");

  return `
    <div class="timer-tab">
      <div class="timer-modes">${modeButtons}</div>
      <div class="timer-display" id="timer-display">${timerDisplay}</div>
      ${subjectHtml}
      <div class="timer-actions">
        ${startStopHtml}
      </div>
    </div>
  `;
}
