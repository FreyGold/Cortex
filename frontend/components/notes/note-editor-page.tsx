"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NotionEditor } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { GlobalAssistantModal } from "./global-assistant-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
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
  useArchiveNote,
  useCreateCourseResource,
} from "@/hooks/use-notes";
import { useCatalog } from "@/hooks/use-data";
import { 
  Share2, 
  Trash2, 
  BookOpen, 
  History, 
  Sparkles, 
  Tags, 
  FolderIcon, 
  Search,
  Link2,
  Users,
  Copy,
  ChevronDown
} from "lucide-react";

type NoteEditorPageProps = {
  noteId: string;
};

export function NoteEditorPage({ noteId }: NoteEditorPageProps) {
  const router = useRouter();
  const detailQuery = useNoteDetail(noteId);
  const sharesQuery = useNoteShares(noteId);
  const catalogQuery = useCatalog();
  const updateNote = useUpdateNote(noteId);
  const updateTags = useUpdateNoteTags(noteId);
  const archiveNoteMutation = useArchiveNote();
  const createResourceMutation = useCreateCourseResource(noteId);
  const createShare = useCreateNoteShare(noteId);
  const deleteShare = useDeleteNoteShare(noteId);
  const embedNoteMutation = useEmbedNote();
  const semanticSearchMutation = useSemanticSearch();
  const summaryMutation = useGenerateSummary(noteId);
  const suggestTagsMutation = useSuggestTags(noteId);

  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState<string | Record<string, unknown>>("");
  const [html, setHtml] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [suggestedTagsText, setSuggestedTagsText] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [shareMode, setShareMode] = useState<"user" | "link">("user");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);

  useEffect(() => {
    const note = detailQuery.data?.note;
    if (!note) return;
    setTitle(note.title ?? "Untitled note");
    
    // Support both Tiptap JSON and HTML
    const content = note.content;
    const htmlFromContent = (typeof content === "object" && content !== null && "html" in content)
      ? (content as { html: string }).html
      : (typeof content === "string" ? content : "");

    const fallbackHtml = note.content_text
      ? `<p>${note.content_text.replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]!))}</p>`
      : "";

    setEditorContent((content as any) || fallbackHtml);

    setHtml(htmlFromContent || fallbackHtml);
    setFolderId(note.folder_id ?? "");
    setSelectedTagIds((detailQuery.data?.noteTags ?? []).map((item) => item.tag_id));
    setSummaryText(note.summary ?? null);
    setDirty(false);
  }, [detailQuery.data]);

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

  if (detailQuery.isLoading) return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground animate-pulse">Initializing editor...</div>;
  if (detailQuery.isError || !detailQuery.data) return <div className="p-8 text-destructive">Failed to load note context.</div>;

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to move this note to trash?")) return;
    await archiveNoteMutation.mutateAsync(noteId);
    router.push("/notes");
  };

  const handleCreateResource = async (courseId: string) => {
    try {
      await createResourceMutation.mutateAsync({
        courseId,
        titleEn: title || "Note Resource",
      });
      setResourceOpen(false);
      alert("Note added to course resources!");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const copyShareToken = async (token: string) => {
    const url = `${window.location.origin}/notes/public/${noteId}?shareToken=${token}`;
    await navigator.clipboard.writeText(url);
    setShareFeedback("Public link copied!");
  };

  const handleCreateShare = async () => {
    setShareFeedback(null);
    try {
      const created = await createShare.mutateAsync({
        mode: shareMode,
        sharedWithUserId: shareMode === "user" ? recipientUserId.trim() : undefined,
        canEdit: shareCanEdit,
      });
      if (created.share_token) await copyShareToken(created.share_token);
      else setShareFeedback("Shared with user!");
    } catch (error: any) {
      setShareFeedback(error.message);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full w-full items-stretch overflow-hidden bg-background">
        {/* MAIN EDITOR AREA */}
        <div className="flex flex-1 flex-col min-w-0 border-r border-border/10 overflow-x-visible h-full">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible custom-scrollbar px-4 py-8 lg:px-16 lg:py-12">
            <div className="w-full mx-auto space-y-6">
              <div className="flex items-center justify-between group/title">
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                  className="h-auto border-none bg-transparent px-0 py-2 text-4xl font-extrabold shadow-none placeholder:text-muted-foreground/20 focus-visible:ring-0 md:text-6xl tracking-tighter"
                  placeholder="Naming your breakthrough..."
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleArchive}
                  className="opacity-0 group-hover/title:opacity-100 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full"
                  title="Delete Note"
                >
                  <Trash2 className="size-5" />
                </Button>
              </div>

              <NotionEditor
                content={editorContent}
                onChange={(v) => { setEditorContent(v); setHtml(v); setDirty(true); }}
                className="w-full"
                showToolbar
                autofocus
                editorClassName="pb-40 text-lg leading-relaxed px-0"
              />

              <p className="text-[11px] font-medium text-muted-foreground/60 border-t border-border/10 pt-4">
                {updateNote.isPending ? "Saving changes..." : lastSavedAt ? `Saved at ${lastSavedAt.toLocaleTimeString()}` : "Autosave active"}
              </p>

              
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex w-[300px] shrink-0 bg-background border-l border-border/5 flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-8">
          {/* PROPERTIES */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Properties</h3>
            <div className="flex flex-col gap-3">
              {/* Folder Selector */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground w-16 shrink-0 flex items-center gap-2">Folder</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="h-7 flex-1 justify-start text-xs font-normal px-2 -mr-2 text-foreground/80 hover:bg-accent/40 rounded border border-transparent hover:border-border/30 transition-all text-left truncate">
                      {folderId ? detailQuery.data.folders.find((f: any) => f.id === folderId)?.name : <span className="text-muted-foreground opacity-60 italic">Move to...</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 shadow-2xl border-border/40" align="end">
                    <Command>
                      <CommandInput placeholder="Search folders..." className="h-8 text-xs" />
                      <CommandList>
                        <CommandEmpty className="text-xs py-4 text-center text-muted-foreground italic">No folders found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem className="text-xs" onSelect={() => { setFolderId(""); setDirty(true); }}>No folder (Root)</CommandItem>
                          {detailQuery.data.folders.map((f: any) => (
                            <CommandItem key={f.id} className="text-xs" onSelect={() => { setFolderId(f.id); setDirty(true); }}>{f.name}</CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-semibold text-muted-foreground/70">Tags</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 p-0 text-[10px] text-primary/70 hover:text-primary hover:bg-transparent">
                        + Edit
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search tags..." className="h-8 text-xs" />
                        <CommandList>
                          <CommandGroup>
                            {detailQuery.data.tags.map((tag: any) => {
                              const isSelected = selectedTagIds.includes(tag.id);
                              return (
                                <CommandItem 
                                  key={tag.id} 
                                  className="text-xs"
                                  onSelect={() => {
                                    const next = isSelected ? selectedTagIds.filter(id => id !== tag.id) : [...selectedTagIds, tag.id];
                                    setSelectedTagIds(next);
                                    updateTags.mutate(next);
                                  }}
                                >
                                  <div className={cn("mr-2 size-2 rounded-full border", isSelected ? "bg-primary border-primary" : "bg-transparent border-muted-foreground/30")} />
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
                <div className="flex flex-wrap gap-1.5">
                  {selectedTagIds.length > 0 ? (
                    selectedTagIds.map(id => {
                      const t = detailQuery.data.tags.find((t: any) => t.id === id);
                      return t && <Badge key={id} variant="secondary" className="px-1.5 py-0 h-4.5 text-[9px] font-medium rounded bg-muted text-muted-foreground border-border/50 uppercase tracking-tight">{t.name}</Badge>;
                    })
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40 italic px-1">No tags</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-8 text-[10px] font-bold bg-background border-border/60 hover:bg-accent/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded group">
                      <Share2 className="size-3 mr-1.5 text-muted-foreground group-hover:text-primary" />
                      Share
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Share2 className="size-5 text-primary" />
                        Note Sharing
                      </DialogTitle>
                      <DialogDescription>Control who can view or edit this document.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-3">
                      <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
                        <Button variant={shareMode === "user" ? "secondary" : "ghost"} className="flex-1 h-9 text-xs rounded-lg shadow-none" onClick={() => setShareMode("user")}>
                          <Users className="size-3.5 mr-2" /> Private User
                        </Button>
                        <Button variant={shareMode === "link" ? "secondary" : "ghost"} className="flex-1 h-9 text-xs rounded-lg shadow-none" onClick={() => setShareMode("link")}>
                          <Link2 className="size-3.5 mr-2" /> Public Link
                        </Button>
                      </div>

                      {shareMode === "user" && <Input placeholder="Recipient User UUID..." value={recipientUserId} onChange={(e) => setRecipientUserId(e.target.value)} className="h-10 text-sm rounded-lg" />}

                      <div className="flex items-center justify-between py-2 px-1">
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold">Collaborative access</p>
                          <p className="text-[10px] text-muted-foreground">Allows the recipient to edit this note.</p>
                        </div>
                        <input type="checkbox" checked={shareCanEdit} onChange={(e) => setShareCanEdit(e.target.checked)} className="size-4 accent-primary" />
                      </div>

                      <Button className="w-full h-10 shadow-lg shadow-primary/20 rounded-lg group" onClick={handleCreateShare} disabled={createShare.isPending}>
                        {createShare.isPending ? "Generating..." : (shareMode === "link" ? "Generate Access Link" : "Grant User Access")}
                        <Sparkles className="size-3.5 ml-2 opacity-60 group-hover:scale-125 transition-transform" />
                      </Button>

                      {shareFeedback && <p className="text-[11px] text-center text-primary font-bold px-4 py-2 bg-primary/5 rounded-lg animate-in fade-in slide-in-from-top-1">{shareFeedback}</p>}

                      {sharesQuery.data && sharesQuery.data.length > 0 && (
                        <div className="space-y-2 border-t border-border/20 pt-4">
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 px-1">Active Permissions</p>
                          {sharesQuery.data.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between text-[11px] bg-muted/20 p-2.5 rounded-lg border border-border/10">
                              <span className="font-medium opacity-70 flex items-center gap-2">
                                {s.shared_with_user_id ? <Users className="size-3" /> : <Link2 className="size-3" />}
                                {s.shared_with_user_id ? `User: ${s.shared_with_user_id.slice(0, 8)}...` : `Link: ${s.share_token?.slice(0, 8)}...`}
                                {s.can_edit && <Badge variant="outline" className="h-4 text-[8px] bg-emerald-500/10 text-emerald-500 border-none px-1">Editor</Badge>}
                              </span>
                              <Button variant="ghost" className="h-6 text-[10px] text-destructive hover:bg-destructive/10" onClick={() => deleteShare.mutate(s.id)}>Revoke</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-8 text-[10px] font-bold bg-background border-border/60 hover:bg-accent/40 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded group">
                      <BookOpen className="size-3 mr-1.5 text-muted-foreground group-hover:text-primary" />
                      Publish
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="size-5 text-primary" />
                        Course Resource
                      </DialogTitle>
                      <DialogDescription>Convert this note into a permanent resource for a specific course.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground/60 px-0.5">Select Course</label>
                        <Command className="border rounded-xl">
                          <CommandInput placeholder="Filter courses..." className="h-9 text-xs" />
                          <CommandList className="max-h-[240px]">
                            {catalogQuery.isLoading ? <div className="p-4 text-xs text-center animate-pulse">Loading catalog...</div> : (
                              catalogQuery.data?.courses?.map(course => (
                                <CommandItem key={course.id} className="text-xs p-2" onSelect={() => handleCreateResource(course.id)}>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-foreground">{course.name_en}</span>
                                    <span className="text-[10px] text-muted-foreground">{course.code}</span>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandList>
                        </Command>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-4 border-t border-border/10">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assistant</h3>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" className="h-9 w-full text-xs justify-start px-3 bg-background border border-border/40 shadow-sm hover:bg-accent/5 transition-all text-muted-foreground hover:text-foreground group" onClick={() => embedNoteMutation.mutate(noteId)}>
                <div className="size-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors" />
                {embedNoteMutation.isPending ? "Syncing..." : "Sync Context Vector"}
              </Button>
              <Button size="sm" variant="outline" className="h-9 w-full text-xs justify-start px-3 bg-background border border-border/40 shadow-sm hover:bg-accent/5 transition-all text-muted-foreground hover:text-foreground group" onClick={async () => setSummaryText((await summaryMutation.mutateAsync()).summary)}>
                <div className="size-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors" />
                {summaryMutation.isPending ? "Extracting..." : "Generate Summary"}
              </Button>
              <Button size="sm" variant="outline" className="h-9 w-full text-xs justify-start px-3 bg-background border border-border/40 shadow-sm hover:bg-accent/5 transition-all text-muted-foreground hover:text-foreground group" onClick={async () => setSuggestedTagsText((await suggestTagsMutation.mutateAsync()).tags)}>
                <div className="size-1.5 rounded-full bg-primary/40 mr-2 group-hover:bg-primary transition-colors" />
                {suggestTagsMutation.isPending ? "Analyzing..." : "Auto-Tag Document"}
              </Button>
            </div>

            {summaryText && (
              <div className="rounded border border-border/40 bg-muted/10 p-3 mt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Abstract</p>
                <p className="text-xs leading-relaxed text-foreground">{summaryText}</p>
              </div>
            )}
            
            {suggestedTagsText.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {suggestedTagsText.map((tag) => (
                  <Badge key={tag} variant="outline" className="px-1.5 py-0 h-5 text-[10px] font-medium bg-background text-muted-foreground border-border/50">#{tag}</Badge>
                ))}
              </div>
            )}

            <div className="pt-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything..."
                className="min-h-[70px] w-full resize-none text-[13px] bg-transparent border-border/60 focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button 
                variant="outline"
                size="sm"
                className="mt-2 w-full h-9 text-xs bg-background border border-border/40 shadow-sm active:scale-[0.97] flex items-center justify-center gap-2 group" 
                onClick={() => setAssistantOpen(true)}
              >
                <div className="size-1 rounded-full bg-primary/40 group-hover:bg-primary" />
                Open AI Researcher
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <GlobalAssistantModal
        noteId={noteId}
        isOpen={assistantOpen}
        onOpenChange={setAssistantOpen}
        initialQuestion={question}
      />
    </TooltipProvider>
  );
}
