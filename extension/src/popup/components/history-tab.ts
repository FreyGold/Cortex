import { getPomodoroSessions } from "../../lib/api";
import type { PomodoroSession } from "../../lib/types";

async function renderHistoryTab(container: HTMLElement): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  try {
    const { sessions } = await getPomodoroSessions(today);
    container.innerHTML = buildHistoryHtml(sessions, today);
  } catch {
    container.innerHTML = `
      <div class="history-tab">
        <p style="text-align:center;padding:32px 16px;color:var(--text-tertiary);font-size:13px;">
          Could not load sessions. Make sure the backend is running.
        </p>
      </div>
    `;
  }
}

function buildHistoryHtml(sessions: PomodoroSession[], date: string): string {
  const focusSessions = sessions.filter((s) => s.type === "Focus");
  const totalMinutes = focusSessions.reduce((sum, s) => {
    if (s.actual_duration_seconds) return sum + s.actual_duration_seconds;
    return sum + s.duration * 60;
  }, 0);
  const totalHours = Math.floor(totalMinutes / 3600);
  const totalMins = Math.floor((totalMinutes % 3600) / 60);

  const items = sessions
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .map((s) => {
      const start = new Date(s.start_time);
      const end = s.end_time ? new Date(s.end_time) : null;
      const timeStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const endStr = end?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "";
      const dur = s.actual_duration_seconds ?? s.duration * 60;
      const durStr = formatDuration(dur);
      const completed = s.completed ? "" : " (interrupted)";

      return `
        <div class="history-item">
          <span class="history-item-type">${s.type}${completed}</span>
          <span class="history-item-time">${durStr}</span>
          <span class="history-item-range">${timeStr}${endStr ? ` – ${endStr}` : ""}</span>
        </div>
      `;
    })
    .join("");

  const totalStr = totalHours > 0
    ? `${totalHours}h ${totalMins}m`
    : `${totalMins}m`;

  return `
    <div class="history-tab">
      <div class="history-header">
        <h2>Today</h2>
        <span class="history-total">${totalStr} focus</span>
      </div>
      ${items.length > 0
        ? `<div class="history-list">${items}</div>`
        : `<div class="history-empty">No sessions yet today. Start your first focus session!</div>`
      }
    </div>
  `;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m}m ${s}s`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
