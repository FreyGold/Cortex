import type { AuthState } from "../../lib/types";

type SettingsData = {
  backendUrl: string;
  durations: Record<string, number>;
};

function renderSettingsTab(auth: AuthState, settings: SettingsData, onLogout: () => void): string {
  return `
    <div class="settings-tab">
      <div class="settings-section">
        <label>Backend URL</label>
        <input type="text" id="settings-backend-url" value="${settings.backendUrl}" placeholder="http://localhost:4000" />
      </div>

      <div class="settings-section">
        <label>Timer Durations (minutes)</label>
        <div class="settings-durations">
          <div class="settings-duration-item">
            <label>Focus</label>
            <input type="number" id="duration-focus" value="${settings.durations["Focus"] ?? 25}" min="1" max="180" />
          </div>
          <div class="settings-duration-item">
            <label>Short Break</label>
            <input type="number" id="duration-short" value="${settings.durations["Short Break"] ?? 5}" min="1" max="60" />
          </div>
          <div class="settings-duration-item">
            <label>Long Break</label>
            <input type="number" id="duration-long" value="${settings.durations["Long Break"] ?? 15}" min="1" max="120" />
          </div>
        </div>
      </div>

      <div class="settings-section">
        <label>Account</label>
        <div class="settings-user">${auth.user.email}</div>
      </div>

      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary btn-full" id="settings-save">Save</button>
        <button class="btn btn-danger" id="settings-logout">Sign Out</button>
      </div>
    </div>
  `;
}
