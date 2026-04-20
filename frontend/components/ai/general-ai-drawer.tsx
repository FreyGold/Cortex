"use client";

import { Sparkles as Sparkle } from "lucide-react";
import { useMessages } from "next-intl";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBackendUrl } from "@/lib/api/backend-url";
import { getMessage } from "@/lib/messages";
import { createClient, getAccessToken } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputHeader,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Loader2 } from "lucide-react";

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
  const translationMessages = useMessages();
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [text, setText] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSubmitDisabled = useMemo(() => !(text.trim()) || isStreaming, [text, isStreaming]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleTranscriptionChange = (transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  };

  const streamGeneralAnswer = async (
    prompt: string,
    onDelta: (delta: string) => void,
  ) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("You must be signed in to use AI features.");
    }

    const response = await fetch(`${getBackendUrl()}/api/ai/general/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question: prompt }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;
      throw new Error(
        payload?.error ?? payload?.message ?? "Failed to stream response.",
      );
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

  const onHandleSubmit = async (payload: { text: string; files: any[] }) => {
    const normalized = payload.text.trim();
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
      <DialogContent className="right-0 left-auto top-0 h-screen w-[min(100vw,480px)] max-w-none translate-x-0 translate-y-0 rounded-none border-l border-border p-0 flex flex-col bg-background shadow-2xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Sparkle className="size-5 text-primary" />
            {getMessage(
              translationMessages,
              "shell.ai.title",
              "AI Assistant",
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {getMessage(
              translationMessages,
              "shell.ai.subtitle",
              "Ask about any academic topic or for help with your studies.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex size-full flex-col divide-y overflow-hidden bg-background">
          <div className="flex-1">
            <div className="p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <div className="size-12 rounded-2xl bg-primary/5 mx-auto flex items-center justify-center border border-primary/10">
                    <Sparkle className="size-6 text-primary/40" />
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed italic">
                    {getMessage(
                      translationMessages,
                      "shell.ai.empty",
                      "I'm here to help with your academic questions. Ask anything!",
                    )}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.role === 'assistant' ? (
                        <MessageResponse>{message.text}</MessageResponse>
                      ) : (
                        message.text
                      )}
                      {message.pending && (
                        <div className="mt-2 flex items-center gap-2 text-primary/60">
                          <Loader2 className="size-3 animate-spin" />
                          <span className="text-[10px] font-medium uppercase tracking-widest">Generating...</span>
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                ))
              )}
              <div ref={scrollRef} />
            </div>
          </div>

          <div className="grid shrink-0 gap-4 pt-4 bg-background">
            <div className="w-full px-4 pb-4 max-w-4xl mx-auto">
              <PromptInput globalDrop multiple onSubmit={onHandleSubmit}>
                <PromptInputHeader>
                  {/* attachments display could go here */}
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea onChange={(e) => setText(e.target.value)} value={text} placeholder={getMessage(translationMessages, "shell.ai.placeholder", "Ask me anything...")} />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <SpeechInput className="shrink-0" aria-label="Start voice input" onTranscriptionChange={handleTranscriptionChange} title="Start voice input" size="icon-sm" variant="ghost" />
                  </PromptInputTools>
                  <PromptInputSubmit disabled={isSubmitDisabled} status={isStreaming ? 'streaming' : undefined} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
