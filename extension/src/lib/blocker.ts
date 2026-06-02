const BLOCK_ALL_RULE_ID = 1;
const ALLOW_RULES_START = 1000;

const STORAGE_KEY = "ckh_blocker";

export type BlockerState = {
  enabled: boolean;
  greenlist: string[];
};

const DEFAULT_STATE: BlockerState = {
  enabled: false,
  greenlist: ["google.com", "github.com", "stackoverflow.com", "chatgpt.com"],
};

// ── Persistent state ──────────────────────────────────────

async function getBlockerState(): Promise<BlockerState> {
  const result = await chrome.storage.local.get(STORAGE_KEY) as { ckh_blocker?: BlockerState };
  return result.ckh_blocker ?? DEFAULT_STATE;
}

async function setBlockerState(state: BlockerState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

// ── Rule management ───────────────────────────────────────

async function enableBlocker(greenlist: string[]): Promise<void> {
  const state: BlockerState = { enabled: true, greenlist };
  await setBlockerState(state);
  await updateRules(state);
}

async function disableBlocker(): Promise<void> {
  const state: BlockerState = { enabled: false, greenlist: [] };
  await setBlockerState(state);
  await updateRules(state);
}

async function updateGreenlist(domains: string[]): Promise<void> {
  const state = await getBlockerState();
  state.greenlist = domains;
  await setBlockerState(state);
  if (state.enabled) {
    await updateRules(state);
  }
}

async function toggleBlocker(): Promise<BlockerState> {
  const state = await getBlockerState();
  if (state.enabled) {
    await disableBlocker();
    return { ...state, enabled: false };
  } else {
    await enableBlocker(state.greenlist);
    return { ...state, enabled: true };
  }
}

// ── DNR rules engine ──────────────────────────────────────

async function updateRules(state: BlockerState): Promise<void> {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existing.map((r) => r.id);

  if (!state.enabled || state.greenlist.length === 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: [],
    });
    return;
  }

  const allowRules = state.greenlist.map((domain, i) => ({
    id: ALLOW_RULES_START + i,
    priority: 10,
    action: { type: "allow" as const },
    condition: {
      requestDomains: [domain],
      resourceTypes: ["main_frame" as const],
    },
  }));

  const blockRule: chrome.declarativeNetRequest.Rule = {
    id: BLOCK_ALL_RULE_ID,
    priority: 1,
    action: { type: "block" },
    condition: {
      regexFilter: "^https?://",
      resourceTypes: ["main_frame"],
    },
  };

  const removeIds = [
    ...existingIds.filter((id) => id !== BLOCK_ALL_RULE_ID),
    ...allowRules.map((r) => r.id),
  ];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: [blockRule, ...allowRules],
  });
}
