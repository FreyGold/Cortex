"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAskNote, useNoteConversation } from "@/hooks/use-note-ai";
import {
  Sparkles,
  Send,
  User,
  Bot,
  ExternalLink,
  BookOpen,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  references?: Array<{
    excerpt: string;
    similarity: number;
    heading: string | null;
  }>;
};

interface NoteAssistantModalProps {
  noteId: string;
  noteTitle: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuestion?: string;
}

export function NoteAssistantModal({
  noteId,
  noteTitle,
  isOpen,
  onOpenChange,
  initialQuestion,
}: NoteAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [reasoningStep, setReasoningStep] = useState<string>("Thinking...");
  const scrollRef = useRef<HTMLDivElement>(null);

  const askMutation = useAskNote(noteId);
  const conversationMutation = useNoteConversation(noteId);

  // Load history on mount or when opening
  useEffect(() => {
    if (isOpen) {
      handleLoadHistory();
    }
  }, [isOpen]);

  const handleLoadHistory = async () => {
    try {
      const response = await conversationMutation.mutateAsync();
      if (response.messages && response.messages.length > 0) {
        setMessages(response.messages);
      } else if (initialQuestion) {
        handleSend(initialQuestion);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      if (initialQuestion && messages.length === 0) {
        handleSend(initialQuestion);
      }
    }
  };

  // Cycle through reasoning steps for better feedback
  useEffect(() => {
    if (askMutation.isPending) {
      const steps = [
        "Consulting Notes...",
        "Identifying Relevant Passages...",
        "Synthesizing Research...",
        "Deep Reasoning...",
      ];
      let idx = 0;
      const interval = setInterval(() => {
        setReasoningStep(steps[idx % steps.length]);
        idx++;
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [askMutation.isPending]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, askMutation.isPending]);

  const handleSend = async (content: string = input) => {
    if (!content.trim() || askMutation.isPending) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await askMutation.mutateAsync({
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer,
        references: response.references,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Assistant Error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] sm:h-[85vh] p-0 flex flex-col overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Research Assistant
                <Badge
                  variant="muted"
                  className="font-mono text-[10px] uppercase tracking-tighter opacity-70"
                >
                  Grounding Mode
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs truncate max-w-[500px]">
                Analyzing:{" "}
                <span className="font-semibold text-foreground/80">
                  {noteTitle}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-muted/5">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8 max-w-3xl mx-auto">
                {messages.length === 0 && !askMutation.isPending && (
                  <div className="py-20 text-center space-y-4">
                    <div className="size-16 rounded-full bg-primary/5 mx-auto flex items-center justify-center">
                      <Bot className="size-8 text-primary/40" />
                    </div>
                    <h4 className="text-sm font-medium text-foreground/60 italic">
                      Ask a question to start researching your note...
                    </h4>
                  </div>
                )}

                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300",
                      m.role === "user" ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "size-8 shrink-0 rounded-lg flex items-center justify-center shadow-sm border",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground border-primary/20"
                          : "bg-background border-border/40 text-muted-foreground",
                      )}
                    >
                      {m.role === "user" ? (
                        <User className="size-4" />
                      ) : (
                        <Bot className="size-4" />
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex flex-col space-y-2 max-w-[85%]",
                        m.role === "user"
                          ? "items-end text-right"
                          : "items-start",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                            : "bg-background border border-border/30 rounded-tl-none prose prose-sm dark:prose-invert",
                        )}
                      >
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>

                      {/* Sub-sources for this specific message */}
                      {m.references && m.references.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest font-bold">
                            <BookOpen className="size-3" /> Grounded in{" "}
                            {m.references.length} passages
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {askMutation.isPending && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="size-8 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <Loader2 className="size-4 animate-spin text-muted-foreground/40" />
                    </div>
                    <div className="space-y-2 w-full">
                      <div className="h-4 flex items-center">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 animate-pulse">
                          {reasoningStep}
                        </span>
                      </div>
                      <div className="h-20 bg-muted/40 rounded-2xl w-full" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Overlay */}
            <div className="p-6 bg-gradient-to-t from-background via-background to-transparent pt-10 mt-[-40px] z-10">
              <div className="relative max-w-2xl mx-auto">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Inquire further about this document..."
                  className="min-h-[60px] w-full resize-none pr-14 py-4 rounded-2xl border-border/50 bg-background/50 backdrop-blur-md shadow-lg focus-visible:ring-primary/20"
                />
                <Button
                  size="icon"
                  className="absolute right-3 bottom-3 rounded-xl size-9 shadow-lg active:scale-95 transition-all"
                  disabled={!input.trim() || askMutation.isPending}
                  onClick={() => handleSend()}
                >
                  <Send className="size-4" />
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-medium opacity-40">
                Shift + Enter for new line • Grounded in Note Context
              </p>
            </div>
          </div>

          {/* Context/Sources Sidebar (Only shows if there are messages with refs) */}
          {messages.some((m) => m.references && m.references.length > 0) && (
            <div className="w-[300px] border-l border-border/10 bg-muted/20 hidden lg:flex flex-col overflow-hidden">
              <div className="p-5 border-b border-border/10 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/70">
                  Source Evidence
                </h4>
              </div>
              <ScrollArea className="flex-1 p-5">
                <div className="space-y-6">
                  {messages
                    .filter((m) => m.references)
                    .map((m, msgIdx) =>
                      m.references?.map((ref, refIdx) => (
                        <div
                          key={`${msgIdx}-${refIdx}`}
                          className="space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1 border-border/50 bg-background/80"
                            >
                              Passage {refIdx + 1}
                            </Badge>
                            <span className="text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {(ref.similarity * 100).toFixed(0)}% relevant
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-muted-foreground/80 border-l-2 border-primary/20 pl-3 italic line-clamp-6 hover:line-clamp-none transition-all cursor-default">
                            "{ref.excerpt}..."
                          </p>
                        </div>
                      )),
                    )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
