import type { BlockerState } from "../../lib/blocker";

function renderBlockerTab(state: BlockerState): string {
  const toggleLabel = state.enabled ? "Blocking active" : "Blocking off";
  const toggleClass = state.enabled ? "active" : "";

  const domainList = state.greenlist
    .map(
      (d, i) => `
      <div class="blocker-domain-row">
        <span class="blocker-domain-name">${d}</span>
        <button class="blocker-domain-remove" data-index="${i}">remove</button>
      </div>
    `
    )
    .join("");

  return `
    <div class="blocker-tab">
      <div class="blocker-header">
        <h2>Site Blocker</h2>
        <span class="blocker-status ${toggleClass}">${toggleLabel}</span>
      </div>

      <p class="blocker-description">
        Block all websites except those on your greenlist.
        Only ${state.greenlist.length} domain${state.greenlist.length !== 1 ? "s" : ""} currently allowed.
      </p>

      <button class="blocker-toggle btn ${state.enabled ? "btn-danger" : "btn-primary"} btn-full" id="blocker-toggle">
        ${state.enabled ? "Deactivate Blocker" : "Activate Blocker"}
      </button>

      <div class="blocker-section">
        <label>Allowed domains (greenlist)</label>
        ${domainList.length > 0
          ? `<div class="blocker-domain-list">${domainList}</div>`
          : `<p class="blocker-empty">No domains in greenlist — all sites will be blocked.</p>`
        }
      </div>

      <div class="blocker-add-row">
        <input type="text" id="blocker-domain-input" placeholder="e.g. wikipedia.org" />
        <button class="btn btn-primary" id="blocker-add-domain">Add</button>
      </div>
    </div>
  `;
}
