"use client";

import { usePublicNote, useReplicateNote, useNoteDetail, useNoteShares, useUpdateNote, useUpdateNoteTags, useArchiveNote, useCreateCourseResource, useCreateNoteShare, useDeleteNoteShare, useCreateTag } from "@/hooks/use-notes";
import { useEmbedNote, useGenerateSummary, useSuggestTags } from "@/hooks/use-note-ai";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, PanelRight, Star, Archive, Globe, Settings, ChevronDown, PanelLeftClose, Plus, Share2, BookOpen, Sparkles, FolderIcon, Tag as TagIcon, Clock, Users, Link2, MessageSquarePlus, Copy, ClipboardPaste } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlateEditor } from "@/components/editor";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCatalog } from "@/hooks/use-data";
import { GlobalAssistantModal } from "./global-assistant-modal";
import { NotePropertiesSidebar } from "./note-properties-sidebar";

function extractText(content: any): string {
  if (!content) return "";
  if (Array.isArray(content)) {
    return content.map(extractText).join(" ");
  }
  if (typeof content === "object") {
    if (content.text) return content.text;
    if (content.children) return extractText(content.children);
  }
  return "";
}

const INTRO_NOTE_CONTENT = [
  { type: "h1", children: [{ text: "Welcome to Cortex!" }] },
  { type: "p", children: [{ text: "This is your personal academic workspace. Use this space to capture lectures, synthesize research, and organize your studies." }] },
  { type: "h2", children: [{ text: "Features" }] },
  { type: "ul", children: [
    { type: "li", children: [{ text: "Rich-text editing with Plate" }] },
    { type: "li", children: [{ text: "AI-powered summaries and tag suggestions" }] },
    { type: "li", children: [{ text: "Folder-based organization" }] },
    { type: "li", children: [{ text: "Global search and assistant" }] }
  ]},
  { type: "p", children: [{ text: "Feel free to edit this note to try out the editor features. Note that changes to this introduction will not be saved." }] }
];

function NoteEditorSkeleton() {
  return (
    <div className="flex h-full bg-background overflow-hidden relative animate-in fade-in duration-500">
      <div className="flex-1 min-w-0 h-full overflow-y-auto relative custom-scrollbar flex flex-col">
        {/* Toolbar Skeleton */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/5">
          <div className="flex items-center gap-3">
             <Skeleton className="h-3 w-12 rounded opacity-40" />
             <span className="text-muted-foreground/20">/</span>
             <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="w-full px-14 flex-1 pt-12">
          <Skeleton className="h-12 w-3/4 mb-8 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-[90%] rounded" />
            <Skeleton className="h-4 w-[95%] rounded" />
            <Skeleton className="h-4 w-[40%] rounded" />
            
            <div className="pt-8 space-y-4">
                <Skeleton className="h-8 w-1/3 rounded-lg opacity-60" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-[85%] rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Skeleton */}
      <div className="w-[320px] border-l border-border/10 p-5 space-y-8 hidden md:block">
        <div className="space-y-4">
          <Skeleton className="h-3 w-16 rounded opacity-40" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-border/10 space-y-4">
          <Skeleton className="h-3 w-20 rounded opacity-40" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoteEditorPage({ noteId }: { noteId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const isMobile = useIsMobile();
  const isIntroRoute = noteId === "introduction";
  const fetchId = isIntroRoute ? "d538eda1-b07f-45f6-9353-aedefd89b61b" : noteId;
  
  const detailQuery = useNoteDetail(fetchId);
  const sharesQuery = useNoteShares(fetchId);
  const catalogQuery = useCatalog();
  const updateNote = useUpdateNote(fetchId);
  const updateTags = useUpdateNoteTags(fetchId);
  const archiveNoteMutation = useArchiveNote();
  const createResourceMutation = useCreateCourseResource(fetchId);
  const createShare = useCreateNoteShare(fetchId);
  const deleteShare = useDeleteNoteShare(fetchId);
  const embedNoteMutation = useEmbedNote();
  const summaryMutation = useGenerateSummary(fetchId);
  const suggestTagsMutation = useSuggestTags(fetchId);

  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState<any[] | null>(null);
  const [contentText, setContentText] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [shareMode, setShareMode] = useState<"user" | "link">("user");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [resourceOpen, setResourceOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [suggestedTagsText, setSuggestedTagsText] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const createTagMutation = useCreateTag();

  const handleCreateTag = async (name: string) => {
    if (!name.trim()) return;
    try {
      await createTagMutation.mutateAsync(name.trim());
      setTagSearch("");
    } catch (e: any) {
      alert("Error creating tag: " + e.message);
    }
  };

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    const note = detailQuery.data?.note;
    if (!note) return;
    setTitle(note.title ?? "Untitled note");
    
    const content = note.content;
    let initialContent: any[] = [];
    let initialText = "";

    if (Array.isArray(content) && content.length > 0) {
      initialContent = content;
      initialText = extractText(content);
    } else if (typeof content === "object" && content !== null && "html" in content) {
      initialContent = [{ type: "p", children: [{ text: (content as any).html.replace(/<[^>]+>/g, "") }] }];
      initialText = (content as any).html.replace(/<[^>]+>/g, "");
    } else if (typeof content === "string" && content.trim().length > 0) {
      initialContent = [{ type: "p", children: [{ text: content }] }];
      initialText = content;
    } else if (note.content_text && note.content_text.trim().length > 0) {
      initialContent = [{ type: "p", children: [{ text: note.content_text }] }];
      initialText = note.content_text;
    } else {
      initialContent = [{ type: "p", children: [{ text: "" }] }];
      initialText = "";
    }

    setEditorContent(initialContent);
    setContentText(initialText);
    setFolderId(note.folder_id ?? "");
    setSelectedTagIds((detailQuery.data?.noteTags ?? []).map((item) => item.tag_id));
    setSummaryText(note.summary ?? null);
    setDirty(false);
  }, [detailQuery.data]);

  useEffect(() => {
    if (isIntroRoute || !dirty || !editorContent) return;
    const timer = setTimeout(async () => {
      await updateNote.mutateAsync({
        title: title.trim() || "Untitled note",
        content: editorContent,
        contentText,
        folderId: folderId || null,
      });
      setLastSavedAt(new Date());
      setDirty(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isIntroRoute, dirty, folderId, editorContent, contentText, title, updateNote]);

  if (detailQuery.isLoading || !editorContent) return <NoteEditorSkeleton />;
  if (detailQuery.isError || !detailQuery.data) return <div className="p-8 text-destructive">Failed to load note context.</div>;

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to move this note to trash?")) return;
    await archiveNoteMutation.mutateAsync(noteId);
    router.push(`/notes${workspaceId ? `?workspaceId=${workspaceId}` : ""}`);
  };

  const handleCreateResource = async (courseId: string) => {
    try {
      await createResourceMutation.mutateAsync({
        courseId,
        titleEn: title || "Note Resource",
      });
      alert("Note added to course resources!");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleCreateShare = async () => {
    setShareFeedback(null);
    try {
      await createShare.mutateAsync({
        mode: shareMode,
        sharedWithUserId: shareMode === "user" ? recipientUserId.trim() : undefined,
        canEdit: shareCanEdit,
      });
      setShareFeedback("Shared with user!");
    } catch (error: any) {
      setShareFeedback(error.message);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full bg-background overflow-hidden relative">
        <div className="flex-1 min-w-0 h-full overflow-y-auto relative custom-scrollbar flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/5 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Private</span>
               <span className="text-muted-foreground/20 text-lg">/</span>
               <span className="text-sm font-semibold truncate max-w-[200px]">{title || "Untitled note"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {lastSavedAt && (
                <span className="text-[10px] text-muted-foreground/40 hidden sm:inline-block">
                  Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <div className="h-4 w-[1px] bg-border/10 mx-1 hidden sm:block" />
              {!isIntroRoute && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                  onClick={handleArchive}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  sidebarOpen ? "text-primary bg-primary/5 border border-primary/10" : "text-muted-foreground hover:bg-accent/50"
                )}
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <PanelRight className="size-4.5" />
              </Button>
            </div>
          </div>

          <div className="w-full px-14 flex-1 flex flex-col">
            <div className="px-1 md:px-2 pt-12 pb-6 flex flex-col flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                placeholder="Untitled note"
                className="w-full bg-transparent text-4xl md:text-5xl font-bold placeholder:text-muted-foreground/10 focus:outline-none tracking-tight leading-tight mb-8"
              />
              
              <PlateEditor
                content={editorContent}
                onChange={(v) => { 
                  setEditorContent(v); 
                  setContentText(extractText(v)); 
                  setDirty(true); 
                }}
                className="w-full flex-1 pb-10"
                editorClassName="text-lg md:text-xl leading-relaxed outline-none"
              />
            </div>
          </div>

          <GlobalAssistantModal
            noteId={noteId}
            isOpen={assistantOpen}
            onOpenChange={setAssistantOpen}
            initialQuestion={question}
          />
        </div>

        <div className={cn(
          "h-full overflow-y-auto overflow-x-hidden border-l border-border/10 custom-scrollbar transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          sidebarOpen ? "w-[320px] opacity-100" : "w-0 opacity-0 pointer-events-none border-none"
        )}>
          <NotePropertiesSidebar 
            noteId={noteId}
            folderId={folderId}
            setFolderId={setFolderId}
            setDirty={setDirty}
            folders={detailQuery.data?.folders || []}
            tags={detailQuery.data?.tags || []}
            selectedTagIds={selectedTagIds}
            setSelectedTagIds={setSelectedTagIds}
            tagSearch={tagSearch}
            setTagSearch={setTagSearch}
            handleCreateTag={handleCreateTag}
            updateTagsMutation={updateTags}
            shareMode={shareMode}
            setShareMode={setShareMode}
            recipientUserId={recipientUserId}
            setRecipientUserId={setRecipientUserId}
            shareCanEdit={shareCanEdit}
            setShareCanEdit={setShareCanEdit}
            handleCreateShare={handleCreateShare}
            createShareMutation={createShare}
            shareFeedback={shareFeedback}
            shares={sharesQuery.data || []}
            deleteShareMutation={deleteShare}
            resourceOpen={resourceOpen}
            setResourceOpen={setResourceOpen}
            catalogLoading={catalogQuery.isLoading}
            courses={catalogQuery.data?.courses || []}
            handleCreateResource={handleCreateResource}
            embedNoteMutation={embedNoteMutation}
            summaryMutation={summaryMutation}
            suggestTagsMutation={suggestTagsMutation}
            summaryText={summaryText}
            setSummaryText={setSummaryText}
            suggestedTagsText={suggestedTagsText}
            setSuggestedTagsText={setSuggestedTagsText}
            question={question}
            setQuestion={setQuestion}
            setAssistantOpen={setAssistantOpen}
            isOpen={sidebarOpen}
            onOpenChange={setSidebarOpen}
            isMobile={isMobile}
            isPublished={detailQuery.data?.note?.is_published}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
