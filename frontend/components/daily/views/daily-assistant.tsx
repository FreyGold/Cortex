"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Send, Sparkles, User, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { EASE_OUT } from "@/components/daily/full-calendar/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAskDailyAssistant } from "@/hooks/use-daily";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownRenderer = ReactMarkdown as any;

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

interface DailyAssistantProps {
  onClose: () => void;
}

export function DailyAssistant({ onClose }: DailyAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your Daily Assistant. I can help you reflect on your day, summarize your progress, or help you plan tomorrow. What's on your mind?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const askMutation = useAskDailyAssistant();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await askMutation.mutateAsync({
        question: input,
        messages: history,
      });

      const aiMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: res.answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const aiErrorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${e.message || "Failed to connect to the assistant."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiErrorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/10 w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/10 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Assistant
          </h3>
          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Beta
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full hover:bg-accent/50 size-8 transition-colors active:scale-[0.95]"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto custom-scrollbar"
      >
        <div className="space-y-5">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center shrink-0 border border-border/10",
                    msg.role === "assistant"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="size-4" />
                  ) : (
                    <User className="size-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm overflow-hidden",
                    msg.role === "assistant"
                      ? "bg-accent/50 text-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="break-words">
                      <MarkdownRenderer
                        remarkPlugins={[remarkGfm] as any}
                        components={{
                          p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({ node, ...props }: any) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }: any) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                          li: ({ node, ...props }: any) => <li className="mb-0.5" {...props} />,
                          h1: ({ node, ...props }: any) => <h1 className="text-base font-bold mt-4 mb-1 text-foreground" {...props} />,
                          h2: ({ node, ...props }: any) => <h2 className="text-sm font-bold mt-3 mb-1 text-foreground" {...props} />,
                          h3: ({ node, ...props }: any) => <h3 className="text-[13px] font-bold mt-3 mb-1 text-foreground" {...props} />,
                          h4: ({ node, ...props }: any) => <h4 className="text-xs font-bold mt-2 mb-1 text-foreground" {...props} />,
                          a: ({ node, ...props }: any) => <a className="text-primary hover:underline" {...props} />,
                          code: ({ node, className, children, ...props }: any) => (
                            <code className={cn("px-1 py-0.5 rounded bg-muted/65 font-mono text-[11px]", className)} {...props}>
                              {children}
                            </code>
                          ),
                          pre: ({ node, ...props }: any) => <pre className="p-2.5 rounded-lg bg-muted/50 font-mono text-[11.5px] overflow-x-auto mb-2 border border-border/5" {...props} />,
                          hr: ({ node, ...props }: any) => <hr className="my-3 border-border/10" {...props} />,
                        } as any}
                      >
                        {msg.content}
                      </MarkdownRenderer>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="flex gap-3 max-w-[85%] mr-auto"
              >
                <div className="size-8 rounded-full flex items-center justify-center shrink-0 border border-border/10 bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
                <div className="p-3 rounded-2xl bg-accent/50 text-foreground shadow-sm">
                  <div className="flex items-center gap-1">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: EASE_OUT,
                      }}
                      className="size-1.5 rounded-full bg-muted-foreground/50"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.15,
                        ease: EASE_OUT,
                      }}
                      className="size-1.5 rounded-full bg-muted-foreground/50"
                    />
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.3,
                        ease: EASE_OUT,
                      }}
                      className="size-1.5 rounded-full bg-muted-foreground/50"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your day..."
            className="pr-12 bg-accent/20 border-none focus-visible:ring-1 ring-primary/20 h-10 rounded-xl text-xs transition-all"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 size-8 rounded-lg bg-primary hover:bg-primary/90 transition-colors active:scale-[0.95]"
            disabled={!input.trim()}
          >
            {isTyping ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground/30 mt-3 uppercase tracking-tighter font-medium">
          Powered by Cortex AI
        </p>
      </div>
    </div>
  );
}
