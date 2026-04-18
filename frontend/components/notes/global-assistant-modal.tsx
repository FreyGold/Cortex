"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
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
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAskAllNotes, useGlobalConversation } from "@/hooks/use-note-ai";

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

const suggestions = [
  "Summarize my latest notes",
  "How do my AI and ethics notes connect?",
  "What did I write about project management?",
];

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
    [attachments]
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

const SuggestionItem = ({
  suggestion,
  onClick,
}: {
  suggestion: string;
  onClick: (suggestion: string) => void;
}) => {
  const handleClick = useCallback(() => {
    onClick(suggestion);
  }, [onClick, suggestion]);

  return <Suggestion onClick={handleClick} suggestion={suggestion} />;
};

interface GlobalAssistantModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalAssistantModal({ isOpen, onOpenChange }: GlobalAssistantModalProps) {
  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready" | "error">("ready");
  const [messages, setMessages] = useState<MessageType[]>([]);
  
  const { mutateAsync: askAllNotes, isPending: isAsking } = useAskAllNotes();
  const { mutateAsync: loadGlobalConversation } = useGlobalConversation();

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasLoadedRef.current = false;
      return;
    }
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadGlobalConversation().then((res: any) => {
      if (res?.messages) {
        const loaded: MessageType[] = [];
        for (const m of res.messages) {
          if (m.role !== "user" && m.role !== "assistant") continue;
          
          let sources;
          if (m.references?.length) {
            sources = m.references.map((r: any) => ({
              href: `/notes/${r.noteId}`,
              title: r.noteTitle,
            }));
          }

          loaded.push({
            key: nanoid(),
            from: m.role,
            sources,
            versions: [{ id: nanoid(), content: m.content }],
          });
        }
        setMessages(loaded);
      }
    }).catch(console.error);
  }, [isOpen, loadGlobalConversation]);

  useEffect(() => {
    if (isAsking) setStatus("streaming");
    else if (messages.length > 0) setStatus("ready");
    else setStatus("ready");
  }, [isAsking, messages.length]);

  const handleSend = useCallback(async (message: PromptInputMessage | string) => {
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
      const response = await askAllNotes({
        messages: nextMessages.map(m => ({ role: m.from, content: m.versions[0].content })),
      });

      const assistantMessage: MessageType = {
        from: "assistant",
        key: `assistant-${Date.now()}`,
        sources: response.references?.map((r: any) => ({
          href: `/notes/${r.noteId}`,
          title: r.noteTitle,
        })),
        versions: [{ content: response.answer, id: `assistant-ver-${Date.now()}` }],
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (e: any) {
      toast.error("Failed to answer", { description: e.message || "An error occurred." });
      setStatus("error");
    }
  }, [isAsking, messages, askAllNotes]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      handleSend(message);
    },
    [handleSend]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend]
  );

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    []
  );

  const isSubmitDisabled = useMemo(
    () => !(text.trim()) || isAsking,
    [text, isAsking]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-[90vw] md:max-w-[1000px] border-none shadow-2xl">
        <DialogTitle className="sr-only">Library Research Assistant</DialogTitle>
        <DialogDescription className="sr-only">
          Ask questions across your note library and review cited responses.
        </DialogDescription>
        <div className="relative flex size-full flex-col divide-y overflow-hidden bg-background">
          <div className="px-6 py-4 flex items-center justify-between shadow-sm bg-muted/10 shrink-0">
            <h2 className="text-base font-semibold flex items-center gap-3 tracking-tight">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary shadow-sm"><Sparkles className="size-5" /></span>
              Library Research Assistant
            </h2>
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
                       Use the power of AI to instantly retrieve insights, synthesize topics, and find connections across your entire note library.
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
                              <SourcesTrigger count={message.sources.length} />
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
                            <Reasoning duration={message.reasoning.duration}>
                              <ReasoningTrigger />
                              <ReasoningContent>
                                {message.reasoning.content}
                              </ReasoningContent>
                            </Reasoning>
                          )}
                          <MessageContent>
                            <MessageResponse>{version.content}</MessageResponse>
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
                    <Reasoning isStreaming>
                      <ReasoningTrigger>Analyzing library...</ReasoningTrigger>
                      <ReasoningContent>
                        Searching your note indices, evaluating relevant chunks, and compiling an answer...
                      </ReasoningContent>
                    </Reasoning>
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          
          <div className="grid shrink-0 gap-4 pt-4 bg-background">
            {messages.length === 0 && !isAsking && (
              <Suggestions className="px-4 w-full max-w-4xl mx-auto">
                {suggestions.map((suggestion) => (
                  <SuggestionItem
                    key={suggestion}
                    onClick={handleSuggestionClick}
                    suggestion={suggestion}
                  />
                ))}
              </Suggestions>
            )}
            
            <div className="w-full px-4 pb-4 max-w-4xl mx-auto">
              <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                <PromptInputHeader>
                  <PromptInputAttachmentsDisplay />
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea onChange={handleTextChange} value={text} placeholder="Ask anything across your notes..." />
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
                  <PromptInputSubmit disabled={isSubmitDisabled} status={status === "streaming" ? "streaming" : undefined} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
