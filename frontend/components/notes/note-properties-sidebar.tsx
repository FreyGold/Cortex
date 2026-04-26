"use client";

import React, { useMemo, useState } from "react";
import { useUpdateNote } from "@/hooks/use-notes";
import {
  Plus,
  Share2,
  Users,
  Link2,
  BookOpen,
  Sparkles,
  Trash2,
  FolderOpen,
  Tag as TagIcon,
  Calendar,
  FileText,
  ChevronRight,
  RefreshCw,
  AlignLeft,
  Bot,
  PanelRightClose
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

/* ────────────────────────────── types ────────────────────────────── */

interface NotePropertiesSidebarProps {
  noteId: string;
  folderId: string;
  setFolderId: (id: string) => void;
  setDirty: (dirty: boolean) => void;
  folders: any[];
  tags: any[];
  selectedTagIds: string[];
  setSelectedTagIds: (ids: string[]) => void;
  tagSearch: string;
  setTagSearch: (query: string) => void;
  handleCreateTag: (name: string) => void;
  updateTagsMutation: any;
  shareMode: "user" | "link";
  setShareMode: (mode: "user" | "link") => void;
  recipientUserId: string;
  setRecipientUserId: (id: string) => void;
  shareRole: "viewer" | "editor";
  setShareRole: (role: "viewer" | "editor") => void;
  handleCreateShare: () => void;
  createShareMutation: any;
  shareFeedback: string | null;
  shares: any[];
  deleteShareMutation: any;
  resourceOpen: boolean;
  setResourceOpen: (open: boolean) => void;
  catalogLoading: boolean;
  courses: any[];
  handleCreateResource: (courseId: string) => void;
  embedNoteMutation: any;
  summaryMutation: any;
  suggestTagsMutation: any;
  summaryText: string | null;
  setSummaryText: (text: string | null) => void;
  suggestedTagsText: string[];
  setSuggestedTagsText: (tags: string[]) => void;
  question: string;
  setQuestion: (q: string) => void;
  setAssistantOpen: (open: boolean) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile?: boolean;
  isPublished?: boolean;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  wordCount?: number;
  createdAt?: string | null;
  handleArchive?: () => void;
}

/* ────────────────── components ──────────────────────────── */

function SectionHeader({ label, expanded, setExpanded, action }: any) {
  return (
    <div className="flex items-center justify-between px-3 mb-2 group/section mt-6 first:mt-2">
      <button 
        onClick={() => setExpanded && setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors", 
          setExpanded ? "cursor-pointer" : "cursor-default"
        )}
      >
        {setExpanded && <ChevronRight className={cn("size-3 transition-transform", expanded && "rotate-90")} />}
        {label}
      </button>
      {action && (
        <div className="opacity-0 group-hover/section:opacity-100 transition-opacity">
          {action}
        </div>
      )}
    </div>
  );
}

function PropItem({ icon: Icon, label, value, onClick, children }: any) {
  const content = (
    <div 
      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all group select-none text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground cursor-pointer" 
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Icon className="size-4 shrink-0 transition-colors text-muted-foreground/40 group-hover:text-muted-foreground" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-[13px] text-foreground truncate max-w-[120px] text-right pl-2">
        {value}
      </div>
    </div>
  );
  
  if (children) {
    return children(content);
  }
  return content;
}

function ActionItem({ icon: Icon, label, onClick, destructive, disabled, isSpinning }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled || isSpinning}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all group select-none overflow-hidden",
        destructive 
          ? "text-destructive/70 hover:bg-destructive/10 hover:text-destructive" 
          : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground",
        (disabled || isSpinning) && "opacity-50 pointer-events-none"
      )}
    >
      <Icon className={cn(
        "size-4 shrink-0 transition-colors", 
        destructive ? "text-destructive/50 group-hover:text-destructive/70" : "text-muted-foreground/40 group-hover:text-muted-foreground",
        isSpinning && "animate-spin text-primary"
      )} />
      <span className="truncate flex-1 text-left">{label}</span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */

export function NotePropertiesSidebar(props: NotePropertiesSidebarProps) {
  const {
    noteId,
    folderId,
    setFolderId,
    setDirty,
    folders,
    tags,
    selectedTagIds,
    setSelectedTagIds,
    tagSearch,
    setTagSearch,
    handleCreateTag,
    updateTagsMutation,
    shareMode,
    setShareMode,
    recipientUserId,
    setRecipientUserId,
    shareRole,
    setShareRole,
    handleCreateShare,
    createShareMutation,
    shareFeedback,
    shares,
    deleteShareMutation,
    resourceOpen,
    setResourceOpen,
    catalogLoading,
    courses,
    handleCreateResource,
    embedNoteMutation,
    summaryMutation,
    suggestTagsMutation,
    summaryText,
    setSummaryText,
    suggestedTagsText,
    setSuggestedTagsText,
    question,
    setQuestion,
    setAssistantOpen,
    isOpen,
    onOpenChange,
    isMobile = false,
    isPublished = false,
    isSaving = false,
    lastSavedAt,
    wordCount = 0,
    createdAt,
    handleArchive,
  } = props;

  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [aiExpanded, setAiExpanded] = useState(true);

  const updateNote = useUpdateNote(noteId);

  const currentFolder = useMemo(
    () => folders.find((f: any) => f.id === folderId),
    [folders, folderId]
  );

  const formattedDate = useMemo(() => {
    if (!createdAt) return null;
    return new Date(createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [createdAt]);

  const formattedTime = useMemo(() => {
    if (!lastSavedAt) return null;
    return lastSavedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastSavedAt]);

  /* ── render ─────────────────────────────────────────────────────── */

  const content = (
    <div className="w-full flex flex-col h-full bg-[#fbfbfa] dark:bg-[#121212] select-none border-l border-border/5 overflow-x-hidden">
      {/* ▸ HEADER ─────────────────────────────────────────────── */}
      <div className="px-3 pt-4 pb-2 flex items-center justify-between group/header shrink-0">
        <div className="flex items-center gap-2 px-1 flex-1 min-w-0">
           <span className="text-[13px] font-bold tracking-tight text-foreground truncate">Properties</span>
        </div>
        <button 
            onClick={() => onOpenChange(false)}
            className="p-1 text-muted-foreground/30 hover:text-foreground hover:bg-accent/40 rounded-md transition-all opacity-0 group-hover/header:opacity-100"
        >
            <PanelRightClose className="size-4" />
        </button>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <div className={cn("size-1.5 rounded-full", isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {isSaving ? "Saving" : "Synced"}
          </span>
        </div>
        {formattedTime && (
          <span className="text-[10px] text-muted-foreground/30 tabular-nums">
            {formattedTime}
          </span>
        )}
      </div>

      {/* ▸ SCROLLABLE BODY ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 space-y-1">
        
        {/* ── DETAILS ──────────────────────────────────────────────── */}
        <SectionHeader label="Details" expanded={detailsExpanded} setExpanded={setDetailsExpanded} />
        
        {detailsExpanded && (
          <div className="space-y-0.5 ml-1 mb-4">
            {/* Folder */}
            <Popover>
              <PopoverTrigger asChild>
                <div>
                  <PropItem 
                    icon={FolderOpen} 
                    label="Folder" 
                    value={currentFolder?.name ?? <span className="italic opacity-50">Root</span>} 
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 shadow-lg border-border/10 rounded-xl" align="end">
                <Command>
                  <CommandInput placeholder="Move to…" className="h-9 text-xs" />
                  <CommandList>
                    <CommandEmpty className="py-4 text-center text-xs text-muted-foreground italic">No folders.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem className="text-xs" onSelect={() => { setFolderId(""); setDirty(true); }}>
                        Root
                      </CommandItem>
                      {folders.map((f: any) => (
                        <CommandItem key={f.id} className="text-xs" onSelect={() => { setFolderId(f.id); setDirty(true); }}>
                          {f.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Tags */}
            <Popover>
              <PopoverTrigger asChild>
                <div>
                  <PropItem 
                    icon={TagIcon} 
                    label="Tags" 
                    value={
                      selectedTagIds.length > 0 ? (
                        <div className="flex gap-1 justify-end overflow-hidden">
                          {selectedTagIds.slice(0, 2).map(id => {
                            const t = tags.find((t: any) => t.id === id);
                            return t ? (
                              <span key={id} className="px-1.5 bg-accent text-[10px] rounded uppercase tracking-wider">{t.name}</span>
                            ) : null;
                          })}
                          {selectedTagIds.length > 2 && <span className="px-1 text-[10px] text-muted-foreground">+{selectedTagIds.length - 2}</span>}
                        </div>
                      ) : <span className="italic opacity-50 text-[11px]">Add tags…</span>
                    } 
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0 shadow-lg border-border/10 rounded-xl" align="end">
                <Command>
                  <CommandInput placeholder="Find or create…" className="h-9 text-xs" onValueChange={setTagSearch} />
                  <CommandList>
                    <CommandEmpty className="p-0">
                      {tagSearch ? (
                        <Button variant="ghost" className="w-full justify-start text-xs h-9 gap-2 px-3 rounded-none" onClick={() => handleCreateTag(tagSearch)}>
                          <Plus className="size-3 text-primary" /> Create &ldquo;<span className="font-bold text-primary">{tagSearch}</span>&rdquo;
                        </Button>
                      ) : (
                        <div className="py-6 text-center text-xs text-muted-foreground">Type to search or create</div>
                      )}
                    </CommandEmpty>
                    <CommandGroup heading="Tags">
                      {tags.map((tag: any) => {
                        const sel = selectedTagIds.includes(tag.id);
                        return (
                          <CommandItem
                            key={tag.id}
                            className="text-xs py-1.5"
                            onSelect={() => {
                              const next = sel ? selectedTagIds.filter((i) => i !== tag.id) : [...selectedTagIds, tag.id];
                              setSelectedTagIds(next);
                              updateTagsMutation.mutate(next);
                            }}
                          >
                            <div className={cn("mr-2 size-2 rounded-full border transition-all", sel ? "bg-primary border-primary" : "bg-transparent border-muted-foreground/30")} />
                            {tag.name}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Created & Words */}
            {formattedDate && <PropItem icon={Calendar} label="Created" value={<span className="text-muted-foreground/60">{formattedDate}</span>} />}
            <PropItem icon={FileText} label="Words" value={<span className="text-muted-foreground/60">{wordCount.toLocaleString()}</span>} />
          </div>
        )}

        {/* ── ACTIONS ───────────────────────────────────────────────── */}
        <SectionHeader label="Actions" />
        
        <div className="space-y-0.5 ml-1 mb-4">
          {/* Share */}
          <Dialog>
            <DialogTrigger asChild>
              <div><ActionItem icon={Share2} label="Share Note" /></div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
                  <Share2 className="size-4 text-primary" />
                  Share note
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Invite collaborators or create a public link.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-5">
                {/* mode tabs */}
                <div className="flex gap-1 p-1 bg-muted/40 rounded-xl">
                  <Button variant={shareMode === "user" ? "secondary" : "ghost"} className="flex-1 h-8 text-xs rounded-lg shadow-none" onClick={() => setShareMode("user")}>
                    <Users className="size-3.5 mr-2" /> User
                  </Button>
                  <Button variant={shareMode === "link" ? "secondary" : "ghost"} className="flex-1 h-8 text-xs rounded-lg shadow-none" onClick={() => setShareMode("link")}>
                    <Link2 className="size-3.5 mr-2" /> Link
                  </Button>
                </div>

                {shareMode === "user" && (
                  <Input placeholder="Recipient email…" value={recipientUserId} onChange={(e) => setRecipientUserId(e.target.value)} className="h-10 text-sm rounded-lg" />
                )}

                <div className="flex items-center justify-between py-1 px-1">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold">Permission</p>
                    <p className="text-[10px] text-muted-foreground">Controls what this user can do.</p>
                  </div>
                  <Select value={shareRole} onValueChange={(v: any) => setShareRole(v)}>
                    <SelectTrigger className="w-[100px] h-8 text-[10px] rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full h-10 shadow-lg shadow-primary/20 rounded-lg"
                  onClick={async () => {
                    if (shareMode === "link") {
                      updateNote.mutate({ isPublished: true });
                      await navigator.clipboard.writeText(`${window.location.origin}/notes/public/${noteId}`);
                      return;
                    }
                    handleCreateShare();
                  }}
                  disabled={createShareMutation.isPending || updateNote.isPending}
                >
                  {createShareMutation.isPending || updateNote.isPending ? "Generating…" : shareMode === "link" ? "Generate Link" : "Invite"}
                  <Sparkles className="size-3.5 ml-2 opacity-50" />
                </Button>

                {isPublished && shareMode === "link" && (
                  <div className="text-[11px] text-center text-primary font-bold px-4 py-2 bg-primary/5 rounded-lg animate-in fade-in slide-in-from-top-1 flex items-center justify-center gap-2">
                    Link is active.
                    <Button variant="link" className="h-auto p-0 text-primary text-[11px] font-bold" onClick={async () => navigator.clipboard.writeText(`${window.location.origin}/notes/public/${noteId}`)}>Copy</Button>
                    <Button variant="link" className="h-auto p-0 text-destructive text-[11px]" onClick={() => updateNote.mutate({ isPublished: false })}>Revoke</Button>
                  </div>
                )}

                {shareFeedback && shareMode === "user" && (
                  <p className="text-[11px] text-center text-primary font-bold px-4 py-2 bg-primary/5 rounded-lg animate-in fade-in slide-in-from-top-1">
                    {shareFeedback}
                  </p>
                )}

                {shares?.length > 0 && shareMode === "user" && (
                  <div className="space-y-2 border-t border-border/20 pt-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/40 px-1">Active</p>
                    {shares.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-[11px] bg-muted/20 p-2 rounded-lg border border-border/5">
                        <span className="flex items-center gap-2 min-w-0 opacity-70">
                          <Users className="size-3 shrink-0" />
                          <span className="truncate">{s.profiles?.email || s.shared_with_user_id?.slice(0, 8) + "…"}</span>
                        </span>
                        <Button variant="ghost" className="h-6 text-[10px] text-destructive hover:bg-destructive/10 shrink-0" onClick={() => deleteShareMutation.mutate(s.id)}>Revoke</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Publish */}
          <Dialog open={resourceOpen} onOpenChange={setResourceOpen}>
            <DialogTrigger asChild>
              <div><ActionItem icon={BookOpen} label="Publish as Resource" /></div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2 text-lg tracking-tight">
                  <BookOpen className="size-4 text-primary" />
                  Publish as Resource
                </DialogTitle>
                <DialogDescription>
                  Add this note to a university course.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <Command className="border rounded-xl border-border/30">
                  <CommandInput placeholder="Search catalog…" className="h-9 text-xs" />
                  <CommandList className="max-h-[260px]">
                    <CommandEmpty className="py-4 text-xs text-center text-muted-foreground">No courses.</CommandEmpty>
                    {catalogLoading ? (
                      <div className="p-4 text-xs text-center animate-pulse text-muted-foreground">Loading…</div>
                    ) : (
                      <CommandGroup heading="Catalog">
                        {courses?.map((c: any) => (
                          <CommandItem key={c.id} className="flex flex-col items-start gap-0.5 p-2.5 cursor-pointer text-xs" onSelect={() => handleCreateResource(c.id)}>
                            <span className="font-semibold">{c.name_en}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{c.code}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete */}
          {handleArchive && (
            <ActionItem icon={Trash2} label="Delete Note" destructive onClick={handleArchive} />
          )}
        </div>

        {/* ── AI CORE ───────────────────────────────────────────────── */}
        <SectionHeader label="AI Intelligence" expanded={aiExpanded} setExpanded={setAiExpanded} />
        
        {aiExpanded && (
          <div className="space-y-0.5 ml-1">
            <ActionItem 
              icon={RefreshCw} 
              label="Sync Context Vector" 
              isSpinning={embedNoteMutation.isPending} 
              onClick={() => embedNoteMutation.mutate(noteId)} 
            />
            <ActionItem 
              icon={AlignLeft} 
              label="Generate Summary" 
              isSpinning={summaryMutation.isPending} 
              onClick={async () => {
                const r = await summaryMutation.mutateAsync();
                setSummaryText(r.summary);
              }} 
            />
            <ActionItem 
              icon={TagIcon} 
              label="Auto-Tag Document" 
              isSpinning={suggestTagsMutation.isPending} 
              onClick={async () => {
                const r = await suggestTagsMutation.mutateAsync();
                setSuggestedTagsText(r.tags || []);
              }} 
            />

            {/* summary card */}
            <AnimatePresence>
              {summaryText && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-2 mx-1 rounded-lg bg-accent/40 border border-border/5 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Summary</p>
                    <p className="text-[11px] leading-relaxed text-foreground/80">{summaryText}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* suggested tags */}
            <AnimatePresence>
              {suggestedTagsText.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-1 mt-2 px-2">
                  {suggestedTagsText.map((tag) => (
                    <Badge key={tag} variant="outline" className="h-5 px-1.5 text-[9px] font-medium bg-primary/5 text-primary/70 border-primary/10 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => handleCreateTag(tag)}>
                      + {tag}
                    </Badge>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* ▸ BOTTOM SECTION (Collaborators & AI Input) ──────────────── */}
      <div className="shrink-0 pt-2 pb-4 px-3 space-y-4">
        {shares.length > 0 && (
          <div className="flex items-center gap-2.5 px-2 mt-4">
            <div className="flex -space-x-1.5">
              {[...Array(Math.min(shares.length, 3))].map((_, i) => (
                <div key={i} className="size-[18px] rounded-full bg-muted-foreground/15 border-2 border-[#fbfbfa] dark:border-[#121212]" />
              ))}
            </div>
            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
              {shares.length} Collaborator{shares.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <div className="relative group/input mt-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about this note…"
            className="min-h-[70px] w-full resize-none text-[12px] bg-background border border-border/10 rounded-xl focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 py-2.5 px-3 pr-10 shadow-sm"
          />
          <button 
            onClick={() => setAssistantOpen(true)}
            className="absolute bottom-2 right-2 p-1.5 bg-primary text-primary-foreground rounded-lg shadow-sm hover:scale-105 transition-transform"
          >
            <Sparkles className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="p-0 w-[300px] border-l border-border/5 bg-background">
          <SheetHeader className="sr-only">
            <SheetTitle>Note Properties</SheetTitle>
          </SheetHeader>
          <div className="h-full">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return <div className="w-full h-full overflow-hidden">{content}</div>;
}