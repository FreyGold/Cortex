"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NotionEditor } from "@/components/editor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAskNote, useEmbedNote, useGenerateSummary, useSemanticSearch, useSuggestTags } from "@/hooks/use-note-ai";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    setSelectedTagIds((detailQuery.data?.noteTags ?? []).map((item) => item.tag_id));
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
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

  const resolveExpiryIso = () => {
    if (expiryDays === "never") return null;
    const days = Number.parseInt(expiryDays, 10);
    if (Number.isNaN(days) || days <= 0) return null;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  };

  const formatShareTarget = (share: { shared_with_user_id: string | null; share_token: string | null }) => {
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
        sharedWithUserId: shareMode === "user" ? recipientUserId.trim() : undefined,
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
      <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_320px]">
        <Input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setDirty(true);
          }}
          className="h-11 px-3 text-lg font-semibold"
          placeholder="Untitled note"
        />
        <div className="flex gap-2">
          <select
            value={folderId}
            onChange={(event) => {
              setFolderId(event.target.value);
              setDirty(true);
            }}
            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">No folder</option>
            {detailQuery.data.folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
          <Dialog open={shareOpen} onOpenChange={setShareOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-11">
                Share
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Share note</DialogTitle>
                <DialogDescription>
                  Share with a specific user ID or create a token-based share link.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Share mode</p>
                  <Popover open={shareModePickerOpen} onOpenChange={setShareModePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {shareMode === "user" ? "Share with user" : "Create link token"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder="Filter modes..." />
                        <CommandList>
                          <CommandEmpty>No modes found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setShareMode("user");
                                setShareModePickerOpen(false);
                              }}
                            >
                              Share with user
                            </CommandItem>
                            <CommandItem
                              onSelect={() => {
                                setShareMode("link");
                                setShareModePickerOpen(false);
                              }}
                            >
                              Create link token
                            </CommandItem>
                          </CommandGroup>
                          <CommandSeparator />
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {shareMode === "user" ? (
                  <Input
                    value={recipientUserId}
                    onChange={(event) => setRecipientUserId(event.target.value)}
                    placeholder="Recipient user ID (UUID)"
                    className="h-10 w-full px-3 text-sm"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A one-time token will be generated and stored in <code>note_shares.share_token</code>.
                  </p>
                )}

                <div className="flex items-center justify-between rounded-md border border-border p-2">
                  <label className="text-xs text-muted-foreground" htmlFor="share-can-edit">
                    Allow edit access
                  </label>
                  <input
                    id="share-can-edit"
                    type="checkbox"
                    checked={shareCanEdit}
                    onChange={(event) => setShareCanEdit(event.target.checked)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground" htmlFor="share-expiry">
                    Expiration
                  </label>
                  <select
                    id="share-expiry"
                    value={expiryDays}
                    onChange={(event) => setExpiryDays(event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="never">Never</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={handleCreateShare}>
                    {createShare.isPending ? "Creating..." : "Create share"}
                  </Button>
                </div>

                {shareFeedback ? (
                  <p className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    {shareFeedback}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <p className="text-xs font-semibold">Existing shares</p>
                  {sharesQuery.isLoading ? (
                    <p className="text-xs text-muted-foreground">Loading shares...</p>
                  ) : sharesQuery.data && sharesQuery.data.length > 0 ? (
                    sharesQuery.data.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-border p-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">{formatShareTarget(share)}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {share.can_edit ? "Can edit" : "Read only"}
                            {share.expires_at
                              ? ` • Expires ${new Date(share.expires_at).toLocaleDateString()}`
                              : " • No expiry"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {share.share_token ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyShareToken(share.share_token as string)}
                            >
                              Copy token
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              await deleteShare.mutateAsync(share.id);
                            }}
                          >
                            {deleteShare.isPending ? "Revoking..." : "Revoke"}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No shares yet.</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border border-border p-3">
        <p className="mb-2 text-sm font-semibold">Tags</p>
        <div className="flex flex-wrap gap-2">
          {detailQuery.data.tags.map((tag) => {
            const selected = tagSet.has(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-medium ${selected ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"}`}
                onClick={() => {
                  const next = selected
                    ? selectedTagIds.filter((id) => id !== tag.id)
                    : [...selectedTagIds, tag.id];
                  setSelectedTagIds(next);
                }}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateTags.mutate(selectedTagIds)}
          >
            {updateTags.isPending ? "Saving..." : "Save tags"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-md border border-border p-3 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-semibold">AI actions</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => embedNoteMutation.mutate(noteId)}
            >
              {embedNoteMutation.isPending ? "Embedding..." : "Embed note"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const result = await summaryMutation.mutateAsync();
                setSummaryText(result.summary);
              }}
            >
              {summaryMutation.isPending ? "Generating..." : "Generate summary"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const result = await suggestTagsMutation.mutateAsync();
                setSuggestedTagsText(result.tags);
              }}
            >
              {suggestTagsMutation.isPending ? "Suggesting..." : "Suggest tags"}
            </Button>
          </div>

          {summaryText ? (
            <p className="rounded-md bg-muted/40 p-2 text-sm text-muted-foreground">
              {summaryText}
            </p>
          ) : null}
          {suggestedTagsText.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestedTagsText.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Ask this note</p>
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about this note..."
              className="min-h-10 w-full text-sm"
            />
            <Button
              size="sm"
              onClick={() => askMutation.mutate(question)}
              disabled={question.trim().length < 4}
            >
              {askMutation.isPending ? "Asking..." : "Ask"}
            </Button>
          </div>
          {askMutation.data?.answer ? (
            <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
              {askMutation.data.answer}
            </pre>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-border p-3">
        <p className="text-sm font-semibold">Semantic search & related notes</p>
        <div className="flex flex-wrap gap-2">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search across your notes semantically..."
            className="h-10 flex-1 px-3 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => semanticSearchMutation.mutate({ query: searchQuery, limit: 8 })}
            disabled={searchQuery.trim().length < 2}
          >
            {semanticSearchMutation.isPending ? "Searching..." : "Search"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => semanticSearchMutation.mutate({ query: title, limit: 8 })}
            disabled={title.trim().length < 2}
          >
            Find related notes
          </Button>
        </div>

        <div className="space-y-2">
          {(semanticSearchMutation.data?.matches ?? [])
            .filter((item) => item.note_id !== noteId)
            .map((match) => (
              <Link
                href={`/notes/${match.note_id}`}
                key={match.chunk_id}
                className="block rounded-md border border-border p-2 hover:bg-accent/40"
              >
                <p className="text-sm font-semibold">{match.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {match.chunk_text}
                </p>
              </Link>
            ))}
          {semanticSearchMutation.data &&
          semanticSearchMutation.data.matches.filter((item) => item.note_id !== noteId).length ===
            0 ? (
            <p className="text-xs text-muted-foreground">
              No related notes found yet.
            </p>
          ) : null}
        </div>
      </div>

      <NotionEditor
        content={editorContent}
        onChange={(value) => {
          setEditorContent(value);
          setHtml(value);
          setDirty(true);
        }}
        showToolbar
        autofocus
        editorClassName="min-h-[55vh]"
      />

      <p className="text-xs text-muted-foreground">
        {updateNote.isPending
          ? "Saving..."
          : lastSavedAt
            ? `Last saved ${lastSavedAt.toLocaleTimeString()}`
            : "Autosave enabled"}
      </p>
      </div>
    </TooltipProvider>
  );
}
