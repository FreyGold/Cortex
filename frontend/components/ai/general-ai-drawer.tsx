"use client";

import { useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getBackendUrl } from "@/lib/api/backend-url";
import { createClient } from "@/lib/supabase/client";

type ChatItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  pending?: boolean;
};

type GeneralAiDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GeneralAiDrawer({ open, onOpenChange }: GeneralAiDrawerProps) {
  const t = useTranslations("shell.ai");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const streamGeneralAnswer = async (
    prompt: string,
    onDelta: (delta: string) => void,
  ) => {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session?.access_token) {
      throw new Error("You must be signed in to use AI features.");
    }

    const response = await fetch(`${getBackendUrl()}/api/ai/general/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ question: prompt }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      throw new Error(payload?.error ?? payload?.message ?? "Failed to stream response.");
    }

    if (!response.body) {
      throw new Error("Empty response stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const line = event
          .split("\n")
          .map((part) => part.trim())
          .find((part) => part.startsWith("data:"));
        if (!line) continue;
        const payloadText = line.slice(5).trim();
        if (!payloadText) continue;
        const payload = JSON.parse(payloadText) as {
          delta?: string;
          done?: boolean;
          error?: string;
        };
        if (payload.error) {
          throw new Error(payload.error);
        }
        if (payload.delta) {
          onDelta(payload.delta);
        }
      }
    }
  };

  const send = async () => {
    const normalized = question.trim();
    if (normalized.length < 2 || isStreaming) {
      return;
    }

    const userMessageId = `u-${Date.now()}`;
    const pendingMessageId = `a-${Date.now() + 1}`;
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: normalized },
      { id: pendingMessageId, role: "assistant", text: "", pending: true },
    ]);
    setQuestion("");
    setIsStreaming(true);

    try {
      await streamGeneralAnswer(normalized, (delta) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === pendingMessageId
              ? { ...message, text: `${message.text}${delta}` }
              : message,
          ),
        );
      });
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessageId
            ? { ...message, pending: false }
            : message,
        ),
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessageId
            ? { ...message, text: (error as Error).message, pending: false }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="right-0 left-auto top-0 h-screen w-[min(100vw,430px)] max-w-none translate-x-0 translate-y-0 rounded-none border-l border-border p-0"
      >
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2">
            <Sparkle className="size-4" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex h-[calc(100vh-140px)] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className="rounded-none border border-dashed border-border p-3 text-xs text-muted-foreground">
                {t("empty")}
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-none border p-3 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "border-primary/30 bg-primary/10"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
                    {message.role === "user" ? t("you") : t("assistant")}
                  </p>
                  {message.pending ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="inline-block size-3 animate-spin rounded-full border-2 border-border border-t-primary" />
                      <span className="text-xs">{t("sending")}</span>
                    </div>
                  ) : null}
                  {!message.pending && message.role === "assistant" ? (
                    <div className="prose prose-xs max-w-none text-foreground prose-p:my-2 prose-headings:my-2 prose-ul:my-2 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t border-border px-4 py-3">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={t("placeholder")}
              className="min-h-24 resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">{t("hint")}</p>
              <Button onClick={send} disabled={question.trim().length < 2 || isStreaming}>
                {isStreaming ? t("sending") : t("send")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
