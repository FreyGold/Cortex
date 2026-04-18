"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAskNote, useNoteConversation } from "@/hooks/use-note-ai";
import {
  Sparkle,
  Bot,
  BookOpen,
  Loader2,
  ChevronRight,
  History,
  X,
} from "lucide-react";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

type ChatMessage = {
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reasoningStep, setReasoningStep] = useState<string>("Thinking...");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const askMutation = useAskNote(noteId);
  const conversationMutation = useNoteConversation(noteId);

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
        handleSend({ text: initialQuestion, files: [] });
      }
    } catch (error) {
      if (initialQuestion && messages.length === 0) {
        handleSend({ text: initialQuestion, files: [] });
      }
    }
  };

  useEffect(() => {
    if (askMutation.isPending) {
      const steps = [
        "Consulting Note...",
        "Identifying Context...",
        "Synthesizing Research...",
        "Finalizing Answer...",
      ];
      let idx = 0;
      const interval = setInterval(() => {
        setReasoningStep(steps[idx % steps.length]);
        idx++;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [askMutation.isPending]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, askMutation.isPending]);

  const handleSend = async (payload: { text: string; files: any[] }) => {
    const content = payload.text;
    if (!content.trim() || askMutation.isPending) return;

    const userMessage: ChatMessage = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const response = await askMutation.mutateAsync({
        messages: newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMessage: ChatMessage = {
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
      <DialogContent className="sm:max-w-[90vw] sm:h-[90vh] p-0 flex flex-col bg-background border-border/40 shadow-2xl transition-all overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/10 flex flex-row items-center justify-between gap-4 bg-muted/5 z-30">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/5">
              <Sparkle className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 tracking-tight">
                Research Assistant
                <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-tighter h-5">
                  Deep Research
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs truncate max-w-[400px] sm:max-w-[600px] flex items-center gap-1">
                Context: <span className="font-medium text-foreground">{noteTitle}</span>
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-9 rounded-lg transition-all", historyOpen && "bg-primary/10 text-primary")}
              onClick={() => setHistoryOpen(!historyOpen)}
              title="Toggle History"
            >
              <History className="size-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden relative">
          {/* History Sidebar */}
          <div 
            className={cn(
              "flex flex-col border-r border-border/10 bg-muted/20 backdrop-blur-md transition-all duration-500 ease-in-out overflow-hidden z-20",
              historyOpen ? "w-80 opacity-100" : "w-0 opacity-0 border-none"
            )}
          >
            <div className="p-5 border-b border-border/10 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <History className="size-4" />
                History
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {messages.filter(m => m.role === 'user').map((m, idx) => (
                  <div key={idx} className="group relative p-4 rounded-2xl bg-background/40 border border-border/5 hover:border-primary/20 hover:bg-background transition-all cursor-pointer shadow-sm">
                    <p className="text-xs font-bold line-clamp-2 pr-4 leading-relaxed tracking-tight">{m.content}</p>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 size-3 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="py-12 text-center space-y-2">
                    <History className="size-8 text-muted-foreground/20 mx-auto" />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest italic">No session history.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col min-w-0 bg-background relative">
            <ScrollArea className="flex-1">
              <div className="max-w-4xl mx-auto p-8 space-y-12">
                {messages.length === 0 && !askMutation.isPending && (
                  <div className="py-32 text-center space-y-6 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="size-32 rounded-[40px] bg-primary/5 mx-auto flex items-center justify-center border border-primary/10 rotate-6 shadow-2xl relative">
                      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                      <Bot className="size-16 text-primary/40 relative z-10" />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-3xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">Note Companion</h4>
                      <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed font-medium opacity-80 px-4">
                        Ask questions grounded in the context of this specific research note.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <Message key={i} from={m.role} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MessageContent className={m.role === 'assistant' ? "max-w-full" : ""}>
                      {m.role === 'assistant' ? (
                        <div className="space-y-8">
                          <MessageResponse className="text-lg leading-relaxed">{m.content}</MessageResponse>
                          
                          {m.references && m.references.length > 0 && (
                            <Sources className="mt-10 pt-10 border-t border-border/10">
                              <SourcesTrigger count={m.references.length} />
                              <SourcesContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-full mt-8">
                                {m.references.map((ref, idx) => (
                                  <Source key={idx} href="#" title={ref.heading || `Passage ${idx + 1}`}>
                                    <div className="bg-muted/20 p-5 rounded-[24px] border border-border/40 hover:border-primary/40 hover:bg-muted/40 transition-all h-full flex flex-col group/source shadow-sm hover:shadow-xl hover:-translate-y-1">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">
                                          {ref.heading || `Section ${idx + 1}`}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted-foreground">
                                          {(ref.similarity * 100).toFixed(0)}% Match
                                        </span>
                                      </div>
                                      <p className="text-[12px] leading-relaxed text-muted-foreground italic flex-1 line-clamp-5 opacity-90">
                                        "{ref.excerpt}"
                                      </p>
                                    </div>
                                  </Source>
                                ))}
                              </SourcesContent>
                            </Sources>
                          )}
                        </div>
                      ) : (
                        <div className="text-2xl font-black py-2 tracking-tighter text-foreground leading-tight italic border-l-4 border-primary/20 pl-6 my-4 bg-primary/5 rounded-r-2xl py-6 pr-8">{m.content}</div>
                      )}
                    </MessageContent>
                  </Message>
                ))}

                {askMutation.isPending && (
                  <div className="flex gap-6 animate-in fade-in duration-500">
                    <div className="size-12 shrink-0 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/10 shadow-lg">
                      <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                    <div className="space-y-4 w-full">
                      <Reasoning isStreaming={true}>
                        <ReasoningTrigger>
                          <span className="text-base font-black text-primary uppercase tracking-[0.2em] opacity-80 italic animate-pulse">{reasoningStep}</span>
                        </ReasoningTrigger>
                        <ReasoningContent className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                          The assistant is analyzing the note content and retrieving the most relevant sections to provide a factual answer based on your research...
                        </ReasoningContent>
                      </Reasoning>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} className="h-20" />
              </div>
            </ScrollArea>

            <div className="p-10 border-t border-border/10 bg-background/40 backdrop-blur-xl z-30">
              <PromptInput
                onSubmit={handleSend}
                className="mx-auto flex h-auto max-w-4xl flex-col items-stretch overflow-hidden rounded-[32px] border-2 border-border/60 bg-background shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] transition-all duration-500 focus-within:border-primary/60 focus-within:shadow-primary/10 focus-within:ring-[12px] focus-within:ring-primary/5"
              >
                <PromptInputBody className="flex flex-col">
                  <PromptInputTextarea 
                    placeholder="Ask a question about your research..." 
                    className="py-8 px-10 bg-transparent border-none shadow-none focus-visible:ring-0 text-xl min-h-[120px] resize-none font-bold tracking-tight"
                  />
                  <PromptInputFooter className="px-10 pb-8 pt-2">
                    <PromptInputTools>
                      <div className="flex items-center gap-4 bg-muted/30 px-5 py-2 rounded-full border border-border/10 shadow-inner">
                        <div className="size-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
                        <span className="text-[12px] text-foreground/70 font-black uppercase tracking-[0.25em] opacity-80">
                          Grounded Research
                        </span>
                      </div>
                    </PromptInputTools>
                    <PromptInputSubmit 
                      status={askMutation.isPending ? 'streaming' : undefined}
                      className="rounded-[24px] size-16 shadow-2xl hover:scale-110 active:scale-90 transition-all duration-500 bg-primary hover:bg-primary/90 text-primary-foreground border-4 border-primary/20"
                    />
                  </PromptInputFooter>
                </PromptInputBody>
              </PromptInput>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
