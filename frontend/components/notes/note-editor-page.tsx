"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NotionEditor } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { NoteAssistantModal } from "./note-assistant-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  useAskNote,
  useEmbedNote,
  useGenerateSummary,
  useSemanticSearch,
  useSuggestTags,
} from "@/hooks/use-note-ai";
import {
  useCreateNoteShare,
  useDeleteNoteShare,
  useNoteDetail,
  useNoteShares,
  useUpdateNote,
  useUpdateNoteTags,
} from "@/hooks/use-notes";

type NoteEditorPageProps = {
  noteId: string;
};

export function NoteEditorPage({ noteId }: NoteEditorPageProps) {
  const detailQuery = useNoteDetail(noteId);
  const sharesQuery = useNoteShares(noteId);
  const updateNote = useUpdateNote(noteId);
  const updateTags = useUpdateNoteTags(noteId);
  const createShare = useCreateNoteShare(noteId);
  const deleteShare = useDeleteNoteShare(noteId);
  const embedNoteMutation = useEmbedNote();
  const semanticSearchMutation = useSemanticSearch();
  const askMutation = useAskNote(noteId);
  const summaryMutation = useGenerateSummary(noteId);
  const suggestTagsMutation = useSuggestTags(noteId);

  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState<
    string | Record<string, unknown>
  >("");
  const [html, setHtml] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [suggestedTagsText, setSuggestedTagsText] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<"user" | "link">("user");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [expiryDays, setExpiryDays] = useState("7");
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [shareModePickerOpen, setShareModePickerOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    const note = detailQuery.data?.note;
    if (!note) return;
    setTitle(note.title ?? "Untitled note");
    const htmlFromContent =
      typeof note.content === "object" &&
      note.content !== null &&
      "html" in note.content &&
      typeof (note.content as { html?: unknown }).html === "string"
        ? (note.content as { html: string }).html
        : "";
    const fallbackHtml = note.content_text
      ? `<p>${note.content_text.replace(/[&<>]/g, (match) => {
          if (match === "&") return "&amp;";
          if (match === "<") return "&lt;";
          return "&gt;";
        })}</p>`
      : "";
    const incomingContent =
      htmlFromContent ||
      (typeof note.content === "object" && note.content !== null
        ? (note.content as Record<string, unknown>)
        : fallbackHtml);
    setEditorContent(incomingContent);
    setHtml(htmlFromContent || fallbackHtml);
    setFolderId(note.folder_id ?? "");
    setSelectedTagIds(
      (detailQuery.data?.noteTags ?? []).map((item) => item.tag_id),
    );
    setSummaryText(note.summary ?? null);
    setDirty(false);
  }, [detailQuery.data]);

  const tagSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(async () => {
      await updateNote.mutateAsync({
        title: title.trim() || "Untitled note",
        html,
        folderId: folderId || null,
      });
      setLastSavedAt(new Date());
      setDirty(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [dirty, folderId, html, title, updateNote]);

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading note...</p>;
  }
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <p className="text-sm text-destructive">
        {(detailQuery.error as Error)?.message ?? "Failed to load note."}
      </p>
    );
  }

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  const resolveExpiryIso = () => {
    if (expiryDays === "never") return null;
    const days = Number.parseInt(expiryDays, 10);
    if (Number.isNaN(days) || days <= 0) return null;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const formatShareTarget = (share: {
    shared_with_user_id: string | null;
    share_token: string | null;
  }) => {
    if (share.shared_with_user_id) {
      return `User: ${share.shared_with_user_id}`;
    }
    if (share.share_token) {
      return `Link token: ${share.share_token.slice(0, 8)}…`;
    }
    return "Unknown target";
  };

  const copyShareToken = async (token: string) => {
    await navigator.clipboard.writeText(token);
    setShareFeedback("Share token copied.");
  };

  const handleCreateShare = async () => {
    setShareFeedback(null);
    if (shareMode === "user" && !isUuid(recipientUserId.trim())) {
      setShareFeedback("Enter a valid recipient user ID (UUID).");
      return;
    }

    try {
      const created = await createShare.mutateAsync({
        mode: shareMode,
        sharedWithUserId:
          shareMode === "user" ? recipientUserId.trim() : undefined,
        canEdit: shareCanEdit,
        expiresAt: resolveExpiryIso(),
      });

      if (created.share_token) {
        await copyShareToken(created.share_token);
      } else {
        setShareFeedback("Note shared successfully.");
      }
    } catch (error) {
      setShareFeedback((error as Error).message);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        {/* MAIN EDITOR AREA */}
        <div className="min-w-0 flex-1 space-y-4 w-full">
          <Input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
            className="h-auto border-none bg-transparent px-0 py-2 text-3xl font-bold shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0 md:text-4xl"
            placeholder="Untitled note"
          />

          <NotionEditor
            content={editorContent}
            onChange={(value) => {
              setEditorContent(value);
              setHtml(value);
              setDirty(true);
            }}
            showToolbar
            autofocus
            editorClassName="min-h-[60vh] pb-10"
          />

          <p className="text-xs text-muted-foreground">
            {updateNote.isPending
              ? "Saving..."
              : lastSavedAt
                ? `Last saved ${lastSavedAt.toLocaleTimeString()}`
                : "Autosave enabled"}
          </p>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex w-full shrink-0 flex-col space-y-8 pt-2 lg:sticky lg:top-14 lg:w-[280px] pb-12 lg:pl-6 border-l border-border/20">
          {/* PROPERTIES */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Properties
            </h3>
            <div className="flex flex-col gap-2.5">
              {/* Folder Selector */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground w-20 shrink-0 flex items-center gap-2">
                  Folder
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-7 flex-1 justify-start text-xs font-normal px-2 -mr-2 text-foreground/80 hover:bg-accent/40 rounded border border-transparent hover:border-border/30 transition-all text-left truncate"
                    >
                      {folderId ? (
                        <span className="truncate">
                          {
                            detailQuery.data.folders.find(
                              (f: any) => f.id === folderId,
                            )?.name
                          }
                        </span>
                      ) : (
                        <span className="text-muted-foreground opacity-60 italic">
                          Move to...
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0" align="end">
                    <Command>
                      <CommandInput
                        placeholder="Search folders..."
                        className="h-8 text-xs"
                      />
                      <CommandList>
                        <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">
                          No folder found.
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            className="text-xs"
                            onSelect={() => {
                              setFolderId("");
                              setDirty(true);
                            }}
                          >
                            <span className="text-muted-foreground">
                              No folder (Root)
                            </span>
                          </CommandItem>
                          {detailQuery.data.folders.map((folder: any) => (
                            <CommandItem
                              key={folder.id}
                              className="text-xs"
                              onSelect={() => {
                                setFolderId(folder.id);
                                setDirty(true);
                              }}
                            >
                              {folder.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tags Selector */}
              <div className="flex items-start justify-between text-sm min-h-[1.75rem]">
                <span className="text-muted-foreground w-20 shrink-0 mt-1 flex items-center gap-2">
                  Tags
                </span>
                <div className="flex-1 flex flex-wrap gap-1.5 -mr-2">
                  {selectedTagIds
                    .map((id) =>
                      detailQuery.data.tags.find((t: any) => t.id === id),
                    )
                    .filter(Boolean)
                    .map((tag: any) => (
                      <Badge
                        key={tag.id}
                        variant="muted"
                        className="px-1.5 h-5 text-[10px] font-medium rounded-sm border-transparent hover:bg-accent transition-colors"
                      >
                        {tag.name}
                      </Badge>
                    ))}

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 border border-dashed border-border/40 hover:border-border/60"
                      >
                        + Add tags
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                      <Command>
                        <CommandInput
                          placeholder="Find or create tags..."
                          className="h-8 text-xs"
                        />
                        <CommandList>
                          <CommandEmpty className="text-xs py-2 text-center text-muted-foreground">
                            No tags found.
                          </CommandEmpty>
                          <CommandGroup>
                            {detailQuery.data.tags.map((tag: any) => {
                              const isSelected = selectedTagIds.includes(
                                tag.id,
                              );
                              return (
                                <CommandItem
                                  key={tag.id}
                                  className="text-xs"
                                  onSelect={() => {
                                    const next = isSelected
                                      ? selectedTagIds.filter(
                                          (id) => id !== tag.id,
                                        )
                                      : [...selectedTagIds, tag.id];
                                    setSelectedTagIds(next);
                                    updateTags.mutate(next);
                                  }}
                                >
                                  <div
                                    className={cn(
                                      "mr-2 flex h-3.5 w-3.5 items-center justify-center rounded border border-primary/20",
                                      isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "opacity-50",
                                    )}
                                  >
                                    {isSelected && (
                                      <div className="size-1.5 rounded-full bg-current" />
                                    )}
                                  </div>
                                  {tag.name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Share Control */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground w-20 shrink-0 flex items-center gap-2">
                  Share
                </span>
                <div className="flex items-center gap-2 flex-1 justify-end -mr-2">
                  <span className="text-[11px] text-muted-foreground/70 mr-1 font-medium capitalize">
                    {sharesQuery.data && sharesQuery.data.length > 0
                      ? `${sharesQuery.data.length} active`
                      : "Private"}
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-7 text-[10px] font-bold px-2.5 bg-background border border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm"
                      >
                        Manage
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Share Note</DialogTitle>
                        <DialogDescription>
                          Collaborate with users or generate secure links.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Method
                          </label>
                          <div className="flex gap-2">
                            <Button
                              variant={
                                shareMode === "user" ? "secondary" : "outline"
                              }
                              className="flex-1 h-8 text-xs"
                              onClick={() => setShareMode("user")}
                            >
                              User UUID
                            </Button>
                            <Button
                              variant={
                                shareMode === "link" ? "secondary" : "outline"
                              }
                              className="flex-1 h-8 text-xs"
                              onClick={() => setShareMode("link")}
                            >
                              Public Link
                            </Button>
                          </div>
                        </div>

                        {shareMode === "user" && (
                          <Input
                            placeholder="Enter user UUID..."
                            value={recipientUserId}
                            onChange={(e) => setRecipientUserId(e.target.value)}
                            className="h-9 text-sm"
                          />
                        )}

                        <div className="flex items-center justify-between py-2 border-t border-border/10">
                          <span className="text-xs font-medium">
                            Allow Editing
                          </span>
                          <input
                            type="checkbox"
                            checked={shareCanEdit}
                            onChange={(e) => setShareCanEdit(e.target.checked)}
                            className="accent-primary"
                          />
                        </div>

                        <Button
                          className="w-full"
                          onClick={handleCreateShare}
                          disabled={createShare.isPending}
                        >
                          {createShare.isPending
                            ? "Sharing..."
                            : "Create Share Access"}
                        </Button>

                        {shareFeedback && (
                          <p className="text-[10px] text-center text-primary font-medium animate-pulse">
                            {shareFeedback}
                          </p>
                        )}

                        {sharesQuery.data && sharesQuery.data.length > 0 && (
                          <div className="space-y-2 pt-4 border-t border-border/20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Active Shares
                            </p>
                            {sharesQuery.data.map((s: any) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded"
                              >
                                <span className="truncate max-w-[150px]">
                                  {formatShareTarget(s)}
                                </span>
                                <Button
                                  variant="ghost"
                                  className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteShare.mutate(s.id)}
                                >
                                  Revoke
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* AI ACTIONS */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Assistant
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-full text-xs justify-start px-3 bg-background border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm hover:bg-accent/5 transition-all text-muted-foreground hover:text-foreground active:scale-[0.98] group"
                onClick={() => embedNoteMutation.mutate(noteId)}
              >
                <div className="size-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors" />
                {embedNoteMutation.isPending
                  ? "Syncing..."
                  : "Sync Context Vector"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-full text-xs justify-start px-3 bg-background border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm hover:bg-accent/5 transition-all text-muted-foreground hover:text-foreground active:scale-[0.98] group"
                onClick={async () => {
                  const result = await summaryMutation.mutateAsync();
                  setSummaryText(result.summary);
                }}
              >
                <div className="size-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors" />
                {summaryMutation.isPending
                  ? "Extracting..."
                  : "Generate Summary"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-full text-xs justify-start px-3 bg-background border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm hover:bg-accent/5 transition-all text-muted-foreground hover:text-foreground active:scale-[0.98] group"
                onClick={async () => {
                  const result = await suggestTagsMutation.mutateAsync();
                  setSuggestedTagsText(result.tags);
                }}
              >
                <div className="size-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors" />
                {suggestTagsMutation.isPending
                  ? "Analyzing..."
                  : "Auto-Tag Document"}
              </Button>
            </div>

            {summaryText && (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3 mt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Abstract
                </p>
                <p className="text-xs leading-relaxed text-foreground">
                  {summaryText}
                </p>
              </div>
            )}
            {suggestedTagsText.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {suggestedTagsText.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="px-1.5 py-0 h-5 text-[10px] font-medium bg-background text-muted-foreground border-border/50"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask anything..."
                className="min-h-[70px] w-full resize-none text-[13px] bg-transparent border-border/60 focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full h-9 text-xs bg-background border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm active:scale-[0.97] flex items-center justify-center gap-2 group"
                onClick={() => setAssistantOpen(true)}
                disabled={question.trim().length < 2}
              >
                <div className="size-1 rounded-full bg-primary/40 group-hover:bg-primary" />
                Open Research Assistant
              </Button>
            </div>
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* DISCOVERY */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Discovery
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search related topics..."
                  className="h-8 w-full px-3 text-[13px] bg-transparent border-border/60"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 bg-background border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm"
                    onClick={() =>
                      semanticSearchMutation.mutate({
                        query: searchQuery,
                        limit: 5,
                      })
                    }
                    disabled={
                      searchQuery.trim().length < 2 ||
                      semanticSearchMutation.isPending
                    }
                  >
                    {semanticSearchMutation.isPending ? "..." : "Search"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs h-8 bg-background border border-border/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-sm active:scale-[0.98]"
                    onClick={() =>
                      semanticSearchMutation.mutate({ query: title, limit: 5 })
                    }
                    disabled={
                      title.trim().length < 2 ||
                      semanticSearchMutation.isPending
                    }
                  >
                    Auto-Find
                  </Button>
                </div>
              </div>

              {(semanticSearchMutation.data?.matches ?? []).length > 0 &&
                typeof semanticSearchMutation.data?.matches === "object" && (
                  <div className="space-y-2 pt-2">
                    {(semanticSearchMutation.data?.matches ?? [])
                      .filter((item: any) => item.note_id !== noteId)
                      .map((match: any) => (
                        <Link
                          href={`/notes/${match.note_id}`}
                          key={match.chunk_id}
                          className="block rounded border border-transparent p-2 transition-all hover:bg-accent/40 hover:border-border/30 group"
                        >
                          <p className="mb-0.5 text-xs font-semibold leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                            {match.title}
                          </p>
                          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground/70">
                            {match.chunk_text}
                          </p>
                        </Link>
                      ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <NoteAssistantModal
        noteId={noteId}
        noteTitle={title}
        isOpen={assistantOpen}
        onOpenChange={setAssistantOpen}
        initialQuestion={question}
      />
    </TooltipProvider>
  );
}
