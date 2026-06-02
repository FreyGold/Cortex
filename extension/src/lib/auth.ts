import * as api from "./api";
import { getAuth, setAuth, clearAuth } from "./storage";
import type { AuthState } from "./types";

async function loginWithEmail(email: string, password: string): Promise<AuthState> {
  const result = await api.login(email, password);

  if (!result.session) {
    throw new Error("Check your email to confirm your account before signing in.");
  }

  const auth: AuthState = {
    accessToken: result.session.access_token,
    refreshToken: result.session.refresh_token,
    user: { id: result.user.id, email: result.user.email },
  };

  await setAuth(auth);
  return auth;
}

async function loginWithGoogle(): Promise<AuthState> {
  const settings = await chrome.storage.local.get("ckh_settings") as { ckh_settings?: { backendUrl?: string } };
  const backendUrl = settings.ckh_settings?.backendUrl ?? "http://localhost:4000";

  const redirectUri = chrome.identity.getRedirectURL("google-oauth");

  const authUrl = new URL(`${backendUrl}/api/auth/google`);
  authUrl.searchParams.set("redirect_to", redirectUri);

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true,
      },
      async (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          reject(new Error(chrome.runtime.lastError?.message ?? "OAuth cancelled"));
          return;
        }

        try {
          const url = new URL(redirectUrl);
          const params = new URLSearchParams(url.hash.replace("#", "?"));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (!accessToken) {
            reject(new Error("OAuth failed — no access token returned"));
            return;
          }

          let userId = "";
          let userEmail = "";
          try {
            const payload = JSON.parse(atob(accessToken.split(".")[1]));
            userId = payload.sub ?? "";
            userEmail = payload.email ?? "";
          } catch {}

          const auth: AuthState = {
            accessToken,
            refreshToken: refreshToken ?? "",
            user: { id: userId, email: userEmail },
          };

          await setAuth(auth);
          resolve(auth);
        } catch (e) {
          reject(new Error("Failed to process OAuth response"));
        }
      }
    );
  });
}

async function logout(): Promise<void> {
  await clearAuth();
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

async function ensureValidAuth(): Promise<AuthState | null> {
  const auth = await getAuth();
  if (!auth) return null;
  if (!auth.refreshToken) return auth;
  if (!isTokenExpired(auth.accessToken)) return auth;

  const settings = await chrome.storage.local.get("ckh_settings") as { ckh_settings?: { backendUrl?: string } };
  const backendUrl = settings.ckh_settings?.backendUrl ?? "http://localhost:4000";

  try {
    const res = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });
    if (!res.ok) return auth;
    const data = await res.json();
    if (!data.session) return auth;

    const updated: AuthState = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token ?? auth.refreshToken,
      user: data.user ?? auth.user,
    };
    await setAuth(updated);
    return updated;
  } catch {
    return auth;
  }
}
