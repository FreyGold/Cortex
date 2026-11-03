import { clearAuth, getAuth, setAuth } from "./storage";
import type { AuthState } from "./types";

declare const __CORTEX_APP_ORIGIN__: string;
const APP_ORIGIN = __CORTEX_APP_ORIGIN__;
const EXTENSION_ID = "jlklfeiiegaiijfanekakoddlpnkmgcp";
const PENDING_KEY = "ckh_auth_pending";
const CALLBACK_PATH = "/auth/extension-callback";

type PendingAuth = { nonce: string; tabId: number; expiresAt: number };

function tokenIsCurrent(token: string): boolean {
  try {
    const value = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(value));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 30000;
  } catch {
    return false;
  }
}

async function pendingAuth(): Promise<PendingAuth | null> {
  const data = await chrome.storage.session.get(PENDING_KEY);
  return (data[PENDING_KEY] as PendingAuth | undefined) ?? null;
}

async function beginConnection(interactive: boolean): Promise<PendingAuth> {
  const current = await pendingAuth();
  if (current && current.expiresAt > Date.now()) {
    if (interactive) await chrome.tabs.update(current.tabId, { active: true });
    return current;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const tab = await chrome.tabs.create({ url: "about:blank", active: interactive });
  if (tab.id == null) throw new Error("Could not open the sign-in page.");
  const pending = { nonce, tabId: tab.id, expiresAt: Date.now() + (interactive ? 300000 : 30000) };
  await chrome.storage.session.set({ [PENDING_KEY]: pending });
  const callback = new URL(CALLBACK_PATH, APP_ORIGIN);
  callback.searchParams.set("nonce", nonce);
  try {
    await chrome.tabs.update(tab.id, { url: callback.toString() });
  } catch (error) {
    await chrome.storage.session.remove(PENDING_KEY);
    await chrome.tabs.remove(tab.id).catch(() => {});
    throw error;
  }
  return pending;
}

export async function openSignIn(): Promise<void> {
  await beginConnection(true);
}

export async function ensureValidAuth(): Promise<AuthState | null> {
  const current = await getAuth();
  if (!current) return null;
  if (tokenIsCurrent(current.accessToken)) return current;
  return navigator.locks.request("cortex-auth-renewal", async () => {
    const latest = await getAuth();
    if (!latest) return null;
    if (tokenIsCurrent(latest.accessToken)) return latest;
    const pending = await beginConnection(false);
    while (Date.now() < pending.expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const updated = await getAuth();
      if (updated && tokenIsCurrent(updated.accessToken)) return updated;
      const active = await pendingAuth();
      if (!active || active.nonce !== pending.nonce) break;
    }
    const active = await pendingAuth();
    if (active?.nonce === pending.nonce) {
      await chrome.storage.session.remove(PENDING_KEY);
      await chrome.tabs.remove(pending.tabId).catch(() => {});
    }
    return null;
  });
}

export async function acceptConnection(message: unknown, sender: chrome.runtime.MessageSender): Promise<boolean> {
  if (!message || typeof message !== "object") return false;
  const value = message as { type?: unknown; nonce?: unknown; accessToken?: unknown; user?: { id?: unknown; email?: unknown } };
  if (value.type !== "CORTEX_AUTH_RESULT" || typeof value.nonce !== "string" || typeof value.accessToken !== "string" || typeof value.user?.id !== "string" || typeof value.user.email !== "string") return false;
  if (chrome.runtime.id !== EXTENSION_ID || !sender.url || sender.tab?.id == null) return false;
  let url: URL;
  try { url = new URL(sender.url); } catch { return false; }
  const pending = await pendingAuth();
  if (!pending || pending.expiresAt <= Date.now() || pending.tabId !== sender.tab.id || pending.nonce !== value.nonce || url.origin !== APP_ORIGIN || url.pathname !== CALLBACK_PATH || url.searchParams.get("nonce") !== pending.nonce || !tokenIsCurrent(value.accessToken)) return false;
  try {
    const payload = JSON.parse(atob(value.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.sub !== value.user.id || payload.email !== value.user.email || payload.role !== "authenticated") return false;
  } catch { return false; }
  await setAuth({ accessToken: value.accessToken, user: { id: value.user.id, email: value.user.email } });
  await chrome.storage.session.remove(PENDING_KEY);
  return true;
}

export async function logout(): Promise<void> {
  const pending = await pendingAuth();
  await Promise.all([clearAuth(), chrome.storage.session.remove(PENDING_KEY)]);
  if (pending) await chrome.tabs.remove(pending.tabId).catch(() => {});
}
