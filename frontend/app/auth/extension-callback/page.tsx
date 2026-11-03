"use client";

import { useEffect, useRef, useState } from "react";
import { authClient, getAccessToken } from "@/lib/neon/client";

type ExtensionRuntime = {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback: (response?: { accepted?: boolean }) => void,
  ) => void;
  lastError?: { message?: string };
};

const extensionId = "jlklfeiiegaiijfanekakoddlpnkmgcp";

export default function ExtensionCallback() {
  const started = useRef(false);
  const [message, setMessage] = useState("Connecting to Cortex...");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function connect() {
      const current = new URL(window.location.href);
      const nonce = current.searchParams.get("nonce");
      if (!nonce || !/^[a-f0-9]{64}$/.test(nonce)) {
        setMessage("This connection request is invalid.");
        return;
      }
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        const login = new URL("/auth/login", window.location.origin);
        login.searchParams.set("redirectTo", current.pathname + current.search);
        window.location.replace(login.toString());
        return;
      }
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setMessage("Could not connect. Please try again.");
        return;
      }
      const runtime = (window as typeof window & { chrome?: { runtime?: ExtensionRuntime } }).chrome?.runtime;
      if (!runtime) {
        setMessage("The Cortex extension is not available in this browser.");
        return;
      }
      runtime.sendMessage(extensionId, {
        type: "CORTEX_AUTH_RESULT",
        nonce,
        accessToken,
        user: { id: session.user.id, email: session.user.email },
      }, (response) => {
        setMessage(!runtime.lastError && response?.accepted ? "Connected. You can close this tab." : "Could not connect. Please try again.");
      });
    }
    void connect().catch(() => setMessage("Could not connect. Please try again."));
  }, []);

  return <main className="container mx-auto flex min-h-[60vh] items-center justify-center p-6"><p>{message}</p></main>;
}
