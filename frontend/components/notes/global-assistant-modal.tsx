"use client";

import { Plus, Sidebar, Sparkles } from "lucide-react";
import {
  Attachment,
  type AttachmentData,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const simpleId = () => Math.random().toString(36).substring(2, 15);

import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useArchiveGlobalConversation,
  useAskAllNotes,
  useAskNote,
  useClearGlobalConversation,
  useGlobalConversation,
  useListGlobalConversations,
} from "@/hooks/use-note-ai";

interface MessageType {
  key: string;
  from: "user" | "assistant";
  sources?: { href: string; title: string }[];
  versions: {
    id: string;
    content: string;
  }[];
  reasoning?: {
    content: string;
    duration: number;
  };
}
const AttachmentItem = ({
  attachment,
  onRemove,
}: {
  attachment: AttachmentData;
  onRemove: (id: string) => void;
}) => {
  const handleRemove = useCallback(() => {
    onRemove(attachment.id);
  }, [onRemove, attachment.id]);

  return (
    <Attachment data={attachment} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  );
};

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();

  const handleRemove = useCallback(
    (id: string) => {
      attachments.remove(id);
    },
    [attachments],
  );

  if (attachments.files.length === 0) return null;

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <AttachmentItem
          attachment={attachment}
          key={attachment.id}
          onRemove={handleRemove}
        />
      ))}
    </Attachments>
  );
};

interface GlobalAssistantModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  noteId?: string;
  initialQuestion?: string;
}

export function GlobalAssistantModal({
  isOpen,
  onOpenChange,
  noteId,
  initialQuestion,
}: GlobalAssistantModalProps) {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { mutateAsync: askAllNotes, isPending: isAskingAll } = useAskAllNotes();
  const { mutateAsync: askNoteScoped, isPending: isAskingNote } = useAskNote(
    noteId || "",
  );
  const isAsking = isAskingAll || isAskingNote;

  const { mutateAsync: fetchConversation } = useGlobalConversation();
  const { data: history = [], refetch: refreshHistory } =
    useListGlobalConversations(noteId);
  const { mutateAsync: archiveConversation } = useArchiveGlobalConversation();
  const { mutateAsync: deleteConversation } = useClearGlobalConversation();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // The backend now filters history by noteId if provided
  const filteredHistory = history;

  const latestNoteSessionId = useMemo(() => {
    if (!noteId) return null;
    return (
      history.find((s: any) => s.note_id === noteId && s.status !== "archived")
        ?.id || null
    );
  }, [history, noteId]);

  const handleNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setStatus("ready");
    setText("");
  }, []);

  const loadSession = useCallback(
    async (id: string) => {
      try {
        setStatus("ready");
        setActiveId(id);
        const res = await fetchConversation(id);
        if (res?.messages) {
          const loaded: MessageType[] = [];
          for (const m of res.messages) {
            if (m.role !== "user" && m.role !== "assistant") continue;
            let sources;
            if (m.references?.length) {
              sources = m.references.map((r: any) => ({
                href: `/notes/${r.noteId}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`,
                title: r.noteTitle,
              }));
            }
            loaded.push({
              key: simpleId(),
              from: m.role,
              sources,
              versions: [{ id: simpleId(), content: m.content }],
            });
          }
          setMessages(loaded);
        }
      } catch (e) {
        toast.error("Failed to load conversation");
      }
    },
    [fetchConversation],
  );

  const handleArchiveSession = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
        await archiveConversation(id);
        if (activeId === id) handleNewChat();
        refreshHistory();
        toast.success("Conversation archived", {
          description: "Auto-deleted in 3 days.",
        });
      } catch (e) {
        toast.error("Failed to archive session");
      }
    },
    [activeId, archiveConversation, handleNewChat, refreshHistory],
  );

  // Real delete for archived items
  const handleDeleteSession = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
        await deleteConversation(id);
        refreshHistory();
      } catch (e) {
        toast.error("Failed to delete session");
      }
    },
    [deleteConversation, refreshHistory],
  );

  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    if (!isAsking) {
      setLoadingStage(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev < 2 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, [isAsking]);

  const hasAutoSubmittedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      refreshHistory();

      // We no longer auto-load the latest session so that the user gets an empty chat by default.
      // if (noteId && !activeId) {
      //   if (latestNoteSessionId) {
      //     loadSession(latestNoteSessionId);
      //   }
      // }

      if (initialQuestion && !hasAutoSubmittedRef.current) {
        setText(initialQuestion);
        // We defer the auto-submit to ensure hooks and state are ready
        const timer = setTimeout(() => {
          handleSend(initialQuestion);
          hasAutoSubmittedRef.current = true;
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      // Reset auto-submit tracker when modal closes
      hasAutoSubmittedRef.current = false;
    }
  }, [isOpen, noteId, latestNoteSessionId, initialQuestion]);

  useEffect(() => {
    if (isAsking) setStatus("streaming");
    else if (messages.length > 0) setStatus("ready");
    else setStatus("ready");
  }, [isAsking, messages.length]);

  const handleSend = useCallback(
    async (message: PromptInputMessage | string) => {
      const content = typeof message === "string" ? message : message.text;
      if (!content || !content.trim() || isAsking) return;

      setStatus("submitted");
      const userMessage: MessageType = {
        from: "user",
        key: `user-${Date.now()}`,
        versions: [{ content: content.trim(), id: `user-ver-${Date.now()}` }],
      };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      if (typeof message !== "string") {
        setText("");
      }

      try {
        // Use the appropriate mutation based on context
        const askFn = noteId ? askNoteScoped : askAllNotes;

        const response = await askFn({
          messages: nextMessages.map((m) => ({
            role: m.from,
            content: m.versions[0].content,
          })),
          conversationId: activeId || undefined,
          noteId: noteId || undefined,
        });

        if (!activeId && response.id) {
          setActiveId(response.id);
          refreshHistory();
        }

        const assistantMessage: MessageType = {
          from: "assistant",
          key: `assistant-${Date.now()}`,
          sources: response.references?.map((r: any) => ({
            href: `/notes/${r.noteId}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`,
            title: r.noteTitle,
          })),
          versions: [
            { content: response.answer, id: `assistant-ver-${Date.now()}` },
          ],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (e: any) {
        toast.error("Failed to answer", {
          description: e.message || "An error occurred.",
        });
        setStatus("error");
      }
    },
    [isAsking, messages, askAllNotes],
  );

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      handleSend(message);
    },
    [handleSend],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend],
  );

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    [],
  );

  const isSubmitDisabled = useMemo(
    () => !text.trim() || isAsking,
    [text, isAsking],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-h-[850px] flex-col p-0 w-full max-w-[calc(100%-2rem)] sm:max-w-[85vw] md:max-w-[950px] border-none shadow-2xl overflow-visible">
        <DialogTitle className="sr-only">
          Library Research Assistant
        </DialogTitle>
        <DialogDescription className="sr-only">
          Ask questions across your note library and review cited responses.
        </DialogDescription>

        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: -280, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 bottom-0 w-[260px] border border-border/40 bg-background/80 backdrop-blur-xl flex flex-col shrink-0 rounded-2xl shadow-2xl z-[-1]"
            >
              <div className="p-4 border-b border-border/10 shrink-0">
                <Button
                  variant="outline"
                  className="w-full justify-start h-9 bg-primary/5 hover:bg-primary/10 border-primary/20"
                  onClick={handleNewChat}
                  disabled={isAsking}
                >
                  <Plus className="mr-2 size-4" />
                  New Chat
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground mb-3 px-2 uppercase tracking-widest opacity-50">
                  {showArchived
                    ? "Archived Chats (3 Days Left)"
                    : "Active Chats"}
                </div>
                {filteredHistory
                  .filter((s: any) =>
                    showArchived
                      ? s.status === "archived"
                      : s.status !== "archived",
                  )
                  .map((session: any) => (
                    <div
                      key={session.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          loadSession(session.id);
                        }
                      }}
                      onClick={() => loadSession(session.id)}
                      className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                        activeId === session.id
                          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                          : "hover:bg-muted/10 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-3.5 shrink-0 opacity-40" />
                          <span className="text-xs truncate font-medium">
                            {session.title || "Untitled Chat"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 ml-5">
                          <span
                            className={`text-[8px] px-1 py-0.5 rounded border leading-none ${
                              session.note_id
                                ? "bg-blue-500/10 text-blue-400 border-blue-400/20"
                                : "bg-orange-500/10 text-orange-400 border-orange-400/20"
                            }`}
                          >
                            {session.note_id
                              ? session.note_title || "Note"
                              : "All Notes"}
                          </span>
                          <span className="text-[9px] text-muted-foreground/40 whitespace-nowrap relative top-0.5">
                            {formatDistanceToNow(new Date(session.updated_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                      {showArchived ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                          title="Delete permanently"
                          onClick={(e) => handleDeleteSession(e, session.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 opacity-0 group-hover:opacity-100 hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-opacity"
                          title="Archive chat"
                          onClick={(e) => handleArchiveSession(e, session.id)}
                        >
                          <Sidebar className="size-3 rotate-180" />
                        </Button>
                      )}
                    </div>
                  ))}

                {filteredHistory.filter((s: any) =>
                  showArchived
                    ? s.status === "archived"
                    : s.status !== "archived",
                ).length === 0 && (
                  <div className="py-8 text-center px-4">
                    <p className="text-[11px] text-muted-foreground opacity-40 italic">
                      {showArchived
                        ? "No archived chats"
                        : "Your chat history will appear here"}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border/10 bg-muted/5">
                <Button
                  variant="ghost"
                  className={`w-full justify-between h-9 px-3 group ${showArchived ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  <div className="flex items-center gap-2">
                    {showArchived ? (
                      <Plus className="size-3.5 opacity-40 rotate-45" />
                    ) : (
                      <Trash2 className="size-3.5 opacity-40" />
                    )}
                    <span className="text-xs font-medium">
                      {showArchived ? "Back to Active" : "Archive"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full min-w-5 group-hover:bg-muted/20">
                    {
                      filteredHistory.filter(
                        (s: any) => s.status === "archived",
                      ).length
                    }
                  </span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex size-full overflow-hidden bg-background rounded-2xl border border-border/40 shadow-xl">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background divide-y">
            <div className="px-4 py-4 flex items-center justify-between shadow-sm bg-muted/5 shrink-0 border-b border-border/5">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground mr-1"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                >
                  <Sidebar className="size-4" />
                </Button>
                <h2 className="text-base font-semibold flex items-center gap-3 tracking-tight">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary shadow-sm">
                    <Sparkles className="size-4" />
                  </span>
                  Library Research Assistant
                </h2>
              </div>
            </div>

            <Conversation>
              <ConversationContent className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
                {messages.length === 0 && !isAsking && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center min-h-[40vh]">
                    <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm">
                      <Sparkles className="size-7" />
                    </div>
                    <div className="space-y-2 mb-8">
                      <h3 className="text-xl font-semibold text-foreground">
                        How can I help you today?
                      </h3>
                      <p className="max-w-md text-sm text-muted-foreground">
                        Use the power of AI to instantly retrieve insights,
                        synthesize topics, and find connections across your
                        entire note library.
                      </p>
                    </div>
                  </div>
                )}
                {messages.map(({ versions, ...message }) => (
                  <MessageBranch defaultBranch={0} key={message.key}>
                    <MessageBranchContent>
                      {versions.map((version) => (
                        <Message
                          from={message.from}
                          key={`${message.key}-${version.id}`}
                        >
                          <div>
                            {message.sources && message.sources.length > 0 && (
                              <Sources>
                                <SourcesTrigger
                                  count={message.sources.length}
                                />
                                <SourcesContent>
                                  {message.sources.map((source) => (
                                    <Source
                                      href={source.href}
                                      key={source.href}
                                      title={source.title}
                                    />
                                  ))}
                                </SourcesContent>
                              </Sources>
                            )}
                            {message.reasoning && (
                              <ChainOfThought>
                                <ChainOfThoughtHeader>
                                  Reasoning
                                </ChainOfThoughtHeader>
                                <ChainOfThoughtContent>
                                  <ChainOfThoughtStep
                                    label="Thought"
                                    status="complete"
                                  >
                                    {message.reasoning.content}
                                  </ChainOfThoughtStep>
                                </ChainOfThoughtContent>
                              </ChainOfThought>
                            )}
                            <MessageContent>
                              <MessageResponse>
                                {version.content}
                              </MessageResponse>
                            </MessageContent>
                          </div>
                        </Message>
                      ))}
                    </MessageBranchContent>
                    {versions.length > 1 && (
                      <MessageBranchSelector>
                        <MessageBranchPrevious />
                        <MessageBranchPage />
                        <MessageBranchNext />
                      </MessageBranchSelector>
                    )}
                  </MessageBranch>
                ))}

                {isAsking && (
                  <Message from="assistant" key="loading">
                    <MessageContent>
                      <ChainOfThought open>
                        <ChainOfThoughtHeader>
                          <Shimmer duration={1.5} className="font-medium">
                            Analyzing library...
                          </Shimmer>
                        </ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          <ChainOfThoughtStep
                            label="Searching note indices"
                            status={loadingStage === 0 ? "active" : "complete"}
                            description={
                              loadingStage === 0
                                ? "Scanning your connected knowledge base for relevant context..."
                                : "Found potential matches across your notes"
                            }
                          />
                          <ChainOfThoughtStep
                            label="Evaluating context"
                            status={
                              loadingStage === 1
                                ? "active"
                                : loadingStage > 1
                                  ? "complete"
                                  : "pending"
                            }
                            description={
                              loadingStage === 1
                                ? "Ranking chunks and selecting the most pertinent information..."
                                : loadingStage > 1
                                  ? "Context optimized for response"
                                  : undefined
                            }
                          />
                          <ChainOfThoughtStep
                            label="Synthesizing response"
                            status={loadingStage === 2 ? "active" : "pending"}
                            description={
                              loadingStage === 2
                                ? "Compiling a cited answer based on your research..."
                                : undefined
                            }
                          />
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="grid shrink-0 gap-4 pt-4 bg-background">
              <div className="w-full px-4 pb-4 max-w-4xl mx-auto">
                <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                  <PromptInputHeader>
                    <PromptInputAttachmentsDisplay />
                  </PromptInputHeader>
                  <PromptInputBody>
                    <PromptInputTextarea
                      onChange={handleTextChange}
                      value={text}
                      placeholder="Ask anything across your notes..."
                    />
                  </PromptInputBody>
                  <PromptInputFooter>
                    <PromptInputTools>
                      <PromptInputActionMenu>
                        <PromptInputActionMenuTrigger />
                        <PromptInputActionMenuContent>
                          <PromptInputActionAddAttachments />
                        </PromptInputActionMenuContent>
                      </PromptInputActionMenu>
                      <SpeechInput
                        className="shrink-0"
                        aria-label="Start voice input"
                        onTranscriptionChange={handleTranscriptionChange}
                        title="Start voice input"
                        size="icon-sm"
                        variant="ghost"
                      />
                    </PromptInputTools>
                    <PromptInputSubmit
                      disabled={isSubmitDisabled}
                      status={status === "streaming" ? "streaming" : undefined}
                    />
                  </PromptInputFooter>
                </PromptInput>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
