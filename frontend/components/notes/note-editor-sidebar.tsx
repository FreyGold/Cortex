"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useUpdateNote } from "@/hooks/use-notes";
import { 
  Share2, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  Plus,
  FolderIcon,
  Tag as TagIcon,
  ChevronRight,
  Users,
  Link2,
  Clock
} from "lucide-react";
import React, { useState } from "react";

// --- SKELETON LOADERS ---

export function SidebarSkeleton() {
  return (
    <aside className="w-[280px] border-r border-border/40 bg-muted/5 flex flex-col h-full p-4 space-y-8 overflow-y-auto">
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      <div className="space-y-4 pt-4 border-t border-border/10">
        <Skeleton className="h-4 w-24" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </aside>
  );
}

// --- PROPERTY ROW ---

interface PropertyRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
}

function PropertyRow({ icon, label, children, className }: PropertyRowProps) {
  return (
    <div className={cn("group flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors", className)}>
      <div className="flex items-center gap-2 w-[100px] shrink-0 text-muted-foreground/60">
        <div className="size-4 shrink-0">{icon}</div>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex-1 min-w-0 text-xs truncate">
        {children}
      </div>
    </div>
  );
}

// --- SHARING COMPONENT ---

interface SharingDialogProps {
  noteId: string;
  shares: any[];
  onCreateShare: (payload: any) => Promise<any>;
  onDeleteShare: (shareId: string) => Promise<any>;
  isPending?: boolean;
}

export function SharingDialog({ noteId, shares, onCreateShare, onDeleteShare, isPending, updateNote, isPublished }: SharingDialogProps & { updateNote?: any, isPublished?: boolean }) {
  const [shareMode, setShareMode] = useState<"user" | "link">("user");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreate = async () => {
    setFeedback(null);
    try {
      if (shareMode === "link" && updateNote) {
        updateNote.mutate({ isPublished: true });
        const url = `${window.location.origin}/notes/public/${noteId}`;
        await navigator.clipboard.writeText(url);
        setFeedback("Link copied!");
        return;
      }
      
      await onCreateShare({
        mode: shareMode,
        sharedWithUserId: shareMode === "user" ? recipientUserId.trim() : undefined,
        canEdit: shareCanEdit,
      });
      setFeedback("Shared with user!");
    } catch (e: any) {
      setFeedback(e.message);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-8 w-full justify-start gap-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-muted/40 px-2">
          <Share2 className="size-3.5" />
          Share note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
            <Share2 className="size-5 text-primary" />
            Share note
          </DialogTitle>
          <DialogDescription className="text-sm">
            Invite others to collaborate or share a public link.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          <div className="flex p-1 bg-muted/50 rounded-lg">
            <Button 
              variant={shareMode === "user" ? "secondary" : "ghost"} 
              className="flex-1 h-8 text-[11px] rounded-md shadow-none font-bold" 
              onClick={() => setShareMode("user")}
            >
              <Users className="size-3 mr-2" /> Private User
            </Button>
            <Button 
              variant={shareMode === "link" ? "secondary" : "ghost"} 
              className="flex-1 h-8 text-[11px] rounded-md shadow-none font-bold" 
              onClick={() => setShareMode("link")}
            >
              <Link2 className="size-3 mr-2" /> Public Link
            </Button>
          </div>

          {shareMode === "user" && (
            <Input 
              placeholder="Enter User UUID..." 
              value={recipientUserId} 
              onChange={(e) => setRecipientUserId(e.target.value)} 
              className="h-10 text-sm bg-muted/20 border-border/20 focus-visible:ring-primary/20" 
            />
          )}

          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold">Can edit</p>
              <p className="text-[10px] text-muted-foreground">Allows full collaborative editing.</p>
            </div>
            <input 
              type="checkbox" 
              checked={shareCanEdit} 
              onChange={(e) => setShareCanEdit(e.target.checked)} 
              className="size-4 rounded border-border/40 accent-primary" 
            />
          </div>

          <Button 
            className="w-full h-10 shadow-lg shadow-primary/10 rounded-xl font-bold text-xs" 
            onClick={handleCreate} 
            disabled={isPending || (updateNote && updateNote.isPending)}
          >
            {isPending || (updateNote && updateNote.isPending) ? "Sharing..." : (shareMode === "link" ? "Generate & Copy Link" : "Invite User")}
          </Button>

          {isPublished && shareMode === "link" && updateNote && (
            <div className="text-[11px] text-center text-primary font-bold py-2 bg-primary/5 rounded-lg animate-in fade-in zoom-in-95 flex items-center justify-center gap-2">
              Link is active. 
              <Button variant="link" className="h-auto p-0 text-primary text-[11px] font-bold" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/notes/public/${noteId}`); setFeedback("Link copied!"); }}>Copy Link</Button>
              <Button variant="link" className="h-auto p-0 text-destructive text-[11px]" onClick={() => { updateNote.mutate({ isPublished: false }); setFeedback("Link revoked."); }}>Revoke</Button>
            </div>
          )}

          {feedback && shareMode === "user" && (
            <div className="text-[11px] text-center text-primary font-bold py-2 bg-primary/5 rounded-lg animate-in fade-in zoom-in-95">
              {feedback}
            </div>
          )}

          {shares && shares.length > 0 && shareMode === "user" && (
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Active Shares</p>
              <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                {shares.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-[11px] bg-muted/20 p-2.5 rounded-xl border border-border/5">
                    <span className="font-medium opacity-80 flex items-center gap-2 overflow-hidden">
                      <Users className="size-3 shrink-0" />
                      <span className="truncate">{s.shared_with_user_id ? `User: ${s.shared_with_user_id}` : "Unknown"}</span>
                      {s.can_edit && <Badge variant="outline" className="h-4 text-[8px] bg-emerald-500/10 text-emerald-500 border-none px-1 uppercase tracking-tighter">Editor</Badge>}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:bg-destructive/10 rounded-lg px-2" onClick={() => onDeleteShare(s.id)}>Revoke</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN SIDEBAR ---

interface NoteEditorSidebarProps {
  note: any;
  folders: any[];
  tags: any[];
  noteTags: any[];
  shares: any[];
  isReadOnly?: boolean;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  onUpdateNote: (payload: any) => Promise<any>;
  onUpdateTags: (tagIds: string[]) => Promise<any>;
  onArchive: () => Promise<any>;
  onCreateShare: (payload: any) => Promise<any>;
  onDeleteShare: (shareId: string) => Promise<any>;
  onCreateTag: (name: string) => Promise<any>;
  onPublish: (courseId: string) => Promise<any>;
  catalog?: { courses: any[] };
}

export function NoteEditorSidebar({
  note,
  folders,
  tags,
  noteTags,
  shares,
  isReadOnly = false,
  isSaving = false,
  lastSavedAt,
  onUpdateNote,
  onUpdateTags,
  onArchive,
  onCreateShare,
  onDeleteShare,
  onCreateTag,
  onPublish,
  catalog,
}: NoteEditorSidebarProps) {
  const [tagSearch, setTagSearch] = useState("");
  const selectedTagIds = noteTags.map((item) => item.tag_id);

  const handleCreateTag = async (name: string) => {
    if (!name.trim()) return;
    await onCreateTag(name.trim());
    setTagSearch("");
  };

  if (!note) return <SidebarSkeleton />;

  return (
    <aside className="w-[280px] shrink-0 border-l border-border/40 bg-muted/5 flex flex-col h-full overflow-hidden select-none transition-all duration-300 group/sidebar">
      {/* HEADER: STATUS & QUICK ACTIONS */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
            <div className={cn("size-2 rounded-full", isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {isSaving ? "Syncing" : "Synced"}
            </span>
          </div>
          {lastSavedAt && (
            <span className="text-[9px] text-muted-foreground/40 font-medium">
              {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* NOTION-LIKE PAGE ACTIONS */}
        <div className="flex flex-col gap-0.5 -mx-1">
          <SharingDialog
            noteId={note.id}
            shares={shares}
            onCreateShare={onCreateShare}
            onDeleteShare={onDeleteShare}
            updateNote={useUpdateNote(note.id)}
            isPublished={note.is_published}
          />          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-8 w-full justify-start gap-2 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-muted/40 px-2">
                <BookOpen className="size-3.5" />
                Publish to course
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden rounded-2xl border-none shadow-2xl sm:max-w-md">
               <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center gap-2 text-xl tracking-tight">
                  <BookOpen className="size-5 text-primary" />
                  Publish
                </DialogTitle>
                <DialogDescription>Add this note as a resource to a university course.</DialogDescription>
              </DialogHeader>
              <div className="p-6">
                <Command className="border rounded-xl">
                  <CommandInput placeholder="Search catalog..." className="h-10 text-sm" />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No courses found.</CommandEmpty>
                    <CommandGroup heading="University Catalog">
                      {catalog?.courses?.map(course => (
                        <CommandItem 
                          key={course.id} 
                          className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                          onSelect={() => onPublish(course.id)}
                        >
                          <span className="font-bold text-xs">{course.name_en}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{course.code}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="ghost" 
            className="h-8 w-full justify-start gap-2 text-xs font-normal text-muted-foreground hover:text-destructive hover:bg-destructive/5 px-2"
            onClick={onArchive}
          >
            <Trash2 className="size-3.5" />
            Delete note
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-0 space-y-8">
        {/* PROPERTIES SECTION */}
        <div className="space-y-2">
          <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Details</p>
          <div className="space-y-0.5">
            {/* Folder Property */}
            <PropertyRow icon={<FolderIcon />} label="Folder">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-6 w-full justify-start text-[11px] font-medium px-1 -mx-1 hover:bg-muted/60 transition-colors">
                    {note.folder_id ? folders.find(f => f.id === note.folder_id)?.name : "Root"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 shadow-xl border-border/40" align="start">
                  <Command>
                    <CommandInput placeholder="Move to..." className="h-8 text-[11px]" />
                    <CommandList>
                      <CommandGroup>
                        <CommandItem className="text-[11px]" onSelect={() => onUpdateNote({ folderId: null })}>Root</CommandItem>
                        {folders.map((f: any) => (
                          <CommandItem key={f.id} className="text-[11px]" onSelect={() => onUpdateNote({ folderId: f.id })}>
                            {f.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </PropertyRow>

            {/* Tags Property */}
            <PropertyRow icon={<TagIcon />} label="Tags">
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex flex-wrap gap-1 cursor-pointer min-h-6 py-1 group/tags">
                    {selectedTagIds.length > 0 ? (
                      selectedTagIds.map(id => {
                        const t = tags.find(t => t.id === id);
                        return t && <Badge key={id} variant="secondary" className="px-1.5 py-0 h-4 text-[9px] font-bold rounded bg-muted text-muted-foreground border-none uppercase tracking-tight">{t.name}</Badge>;
                      })
                    ) : (
                      <span className="text-[10px] text-muted-foreground/30 italic group-hover/tags:text-muted-foreground transition-colors">Add tags...</span>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 shadow-xl border-border/40" align="start">
                   <Command>
                    <CommandInput 
                      placeholder="Find or create tag..." 
                      className="h-9 text-xs" 
                      onValueChange={setTagSearch}
                    />
                    <CommandList>
                      <CommandEmpty className="p-0">
                        {tagSearch && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-xs h-9 gap-2 px-3 rounded-none"
                            onClick={() => handleCreateTag(tagSearch)}
                          >
                            <Plus className="size-3.5 text-primary" />
                            Create "{tagSearch}"
                          </Button>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {tags.map((tag: any) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          return (
                            <CommandItem 
                              key={tag.id} 
                              className="text-xs py-2"
                              onSelect={() => {
                                const next = isSelected ? selectedTagIds.filter(id => id !== tag.id) : [...selectedTagIds, tag.id];
                                onUpdateTags(next);
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
            </PropertyRow>

            <PropertyRow icon={<Clock />} label="Created">
              <span className="text-[10px] text-muted-foreground/60 font-medium">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </PropertyRow>
          </div>
        </div>

        {/* AI CAPABILITIES */}
        {!isReadOnly && (
          <div className="space-y-3 pt-4 border-t border-border/10">
            <div className="flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-widest text-primary/60">
              <Sparkles className="size-3" />
              <span>AI Core</span>
            </div>
            <div className="flex flex-col gap-1 px-1">
              <Button size="sm" variant="ghost" className="h-8 justify-start text-[11px] font-medium text-muted-foreground hover:text-foreground px-2">
                Analyze document
              </Button>
              <Button size="sm" variant="ghost" className="h-8 justify-start text-[11px] font-medium text-muted-foreground hover:text-foreground px-2">
                Generate summary
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: COLLABORATION HINT */}
      <div className="p-5 border-t border-border/10 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5 overflow-hidden">
            {[1, 2].map((i) => (
              <div key={i} className="inline-block size-5 rounded-full border border-background bg-muted-foreground/20 ring-1 ring-border" />
            ))}
          </div>
          <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
            {shares.length > 0 ? `${shares.length} Active Collaborators` : "Private Workspace"}
          </span>
        </div>
      </div>
    </aside>
  );
}
