"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PlateEditor } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { GlobalAssistantModal } from "./global-assistant-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { 
  useNoteDetail, 
  useNoteShares, 
  useUpdateNote, 
  useUpdateNoteTags, 
  useArchiveNote, 
  useCreateCourseResource, 
  useCreateNoteShare, 
  useDeleteNoteShare, 
  useCreateTag
} from "@/hooks/use-notes";
import { useCatalog } from "@/hooks/use-data";
import { 
  useGenerateSummary, 
  useSuggestTags, 
  useSemanticSearch, 
  useEmbedNote 
} from "@/hooks/use-note-ai";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Trash2, PanelRight } from "lucide-react";
import { NotePropertiesSidebar } from "./note-properties-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type NoteEditorPageProps = {
  noteId: string;
};

const extractText = (nodes: any[]): string => {
  if (!Array.isArray(nodes)) return "";
  return nodes.map(node => {
    if (node.text) return node.text;
    if (node.children) return extractText(node.children);
    return "";
  }).join(" ");
};

export function NoteEditorPage({ noteId }: NoteEditorPageProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
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
  const summaryMutation = useGenerateSummary(noteId);
  const suggestTagsMutation = useSuggestTags(noteId);

  const [title, setTitle] = useState("");
  const [editorContent, setEditorContent] = useState<any[]>([]);
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
    // On mobile, sidebar should be closed by default
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

    if (Array.isArray(content)) {
      initialContent = content;
      initialText = extractText(content);
    } else if (typeof content === "object" && content !== null && "html" in content) {
      initialContent = [{ type: "p", children: [{ text: (content as any).html.replace(/<[^>]+>/g, "") }] }];
      initialText = (content as any).html.replace(/<[^>]+>/g, "");
    } else if (typeof content === "string") {
      initialContent = [{ type: "p", children: [{ text: content }] }];
      initialText = content;
    } else if (note.content_text) {
      initialContent = [{ type: "p", children: [{ text: note.content_text }] }];
      initialText = note.content_text;
    }

    setEditorContent(initialContent);
    setContentText(initialText);
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
        content: editorContent,
        contentText,
        folderId: folderId || null,
      });
      setLastSavedAt(new Date());
      setDirty(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [dirty, folderId, editorContent, contentText, title, updateNote]);

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

  const handleCreateShare = async () => {
    setShareFeedback(null);
    try {
      const created = await createShare.mutateAsync({
        mode: shareMode,
        sharedWithUserId: shareMode === "user" ? recipientUserId.trim() : undefined,
        canEdit: shareCanEdit,
      });
      if (created.share_token) {
        const url = `${window.location.origin}/notes/public/${noteId}?shareToken=${created.share_token}`;
        await navigator.clipboard.writeText(url);
        setShareFeedback("Public link copied!");
      } else {
        setShareFeedback("Shared with user!");
      }
    } catch (error: any) {
      setShareFeedback(error.message);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full bg-background overflow-hidden relative">
        {/* Main Content */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto relative custom-scrollbar flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/5 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
               {/* Minimal breadcrumb can go here */}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                onClick={handleArchive}
              >
                <Trash2 className="size-4" />
              </Button>
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

          <div className="w-full max-w-4xl mx-auto flex-1 pb-40">
            <div className="px-8 pt-12 pb-6">
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
                className="w-full "
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
            "h-full overflow-y-auto border-l border-border/10 custom-scrollbar transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
            sidebarOpen ? "w-[320px] opacity-100" : "w-0 opacity-0 pointer-events-none border-none"
        )}>
          <div className="w-[320px]">
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
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
