"use client";

import React from "react";
import { useUpdateNote } from "@/hooks/use-notes";
import { 
  Plus, 
  Share2, 
  Users, 
  Link2, 
  BookOpen, 
  Sparkles,
  MoreVertical,
  Archive,
  Globe
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
import { motion, AnimatePresence } from "motion/react";

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
  shareCanEdit: boolean;
  setShareCanEdit: (can: boolean) => void;
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
}

export function NotePropertiesSidebar({
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
  shareCanEdit,
  setShareCanEdit,
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
}: NotePropertiesSidebarProps) {
  const updateNote = useUpdateNote(noteId);
  const content = (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-5 space-y-8">
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
                  {folderId ? folders.find((f: any) => f.id === folderId)?.name : <span className="text-muted-foreground opacity-60 italic">Move to...</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 shadow-2xl border-border/40" align="end">
                <Command>
                  <CommandInput placeholder="Search folders..." className="h-8 text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-xs py-4 text-center text-muted-foreground italic">No folders found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem className="text-xs" onSelect={() => { setFolderId(""); setDirty(true); }}>No folder (Root)</CommandItem>
                      {folders.map((f: any) => (
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
                  <Button variant="outline" size="sm" className="h-6 gap-1.5 px-2 text-[10px] uppercase font-bold tracking-tight bg-muted/30 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all rounded shadow-sm group">
                    <Plus className="size-3 text-muted-foreground/60 group-hover:text-primary" />
                    Manage
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 shadow-2xl border-border/40" align="end">
                  <Command>
                    <CommandInput 
                      placeholder="Search or create tag..." 
                      className="h-9 text-xs" 
                      onValueChange={setTagSearch}
                    />
                    <CommandList>
                      <CommandEmpty className="p-0">
                        {tagSearch ? (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-xs h-9 gap-2 px-3 rounded-none border-b border-border/5"
                            onClick={() => handleCreateTag(tagSearch)}
                          >
                            <Plus className="size-3.5 text-primary" />
                            <span>Create <span className="font-bold text-primary">"{tagSearch}"</span></span>
                          </Button>
                        ) : (
                          <div className="py-6 text-center text-xs text-muted-foreground">Type to find or create tags</div>
                        )}
                      </CommandEmpty>
                      <CommandGroup heading="Existing Tags">
                        {tags.map((tag: any) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          return (
                            <CommandItem 
                              key={tag.id} 
                              className="text-xs py-2"
                              onSelect={() => {
                                const next = isSelected ? selectedTagIds.filter(id => id !== tag.id) : [...selectedTagIds, tag.id];
                                setSelectedTagIds(next);
                                updateTagsMutation.mutate(next);
                              }}
                            >
                              <div className={cn("mr-2 size-2.5 rounded-full border transition-all", isSelected ? "bg-primary border-primary scale-110" : "bg-transparent border-muted-foreground/30")} />
                              {tag.name}
                              {isSelected && <Badge variant="outline" className="ml-auto h-4 text-[8px] bg-primary/10 text-primary border-none font-bold">ACTIVE</Badge>}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                      
                      {tagSearch && !tags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                        <CommandGroup heading="Actions">
                          <CommandItem className="text-xs py-2" onSelect={() => handleCreateTag(tagSearch)}>
                            <Plus className="size-3.5 mr-2 text-primary" />
                            Create "{tagSearch}"
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedTagIds.length > 0 ? (
                selectedTagIds.map(id => {
                  const t = tags.find((t: any) => t.id === id);
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

                  <Button className="w-full h-10 shadow-lg shadow-primary/20 rounded-lg group" onClick={async () => {
                    if (shareMode === "link") {
                      updateNote.mutate({ isPublished: true });
                      const url = `${window.location.origin}/notes/public/${noteId}`;
                      await navigator.clipboard.writeText(url);
                      return;
                    }
                    handleCreateShare();
                  }} disabled={createShareMutation.isPending || updateNote.isPending}>
                    {createShareMutation.isPending || updateNote.isPending ? "Generating..." : (shareMode === "link" ? "Generate Access Link" : "Grant User Access")}
                    <Sparkles className="size-3.5 ml-2 opacity-60 group-hover:scale-125 transition-transform" />
                  </Button>

                  {isPublished && shareMode === "link" && (
                    <div className="text-[11px] text-center text-primary font-bold px-4 py-2 bg-primary/5 rounded-lg animate-in fade-in slide-in-from-top-1 flex items-center justify-center gap-2">
                      Link is active. 
                      <Button variant="link" className="h-auto p-0 text-primary text-[11px] font-bold" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/notes/public/${noteId}`); }}>Copy Link</Button>
                      <Button variant="link" className="h-auto p-0 text-destructive text-[11px]" onClick={() => updateNote.mutate({ isPublished: false })}>Revoke</Button>
                    </div>
                  )}

                  {shareFeedback && shareMode === "user" && <p className="text-[11px] text-center text-primary font-bold px-4 py-2 bg-primary/5 rounded-lg animate-in fade-in slide-in-from-top-1">{shareFeedback}</p>}

                  {shares && shares.length > 0 && shareMode === "user" && (
                    <div className="space-y-2 border-t border-border/20 pt-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 px-1">Active Permissions</p>
                      {shares.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between text-[11px] bg-muted/20 p-2.5 rounded-lg border border-border/10">
                          <span className="font-medium opacity-70 flex items-center gap-2">
                            <Users className="size-3" />
                            {s.shared_with_user_id ? `User: ${s.shared_with_user_id.slice(0, 8)}...` : "Unknown"}
                            {s.can_edit && <Badge variant="outline" className="h-4 text-[8px] bg-emerald-500/10 text-emerald-500 border-none px-1">Editor</Badge>}
                          </span>
                          <Button variant="ghost" className="h-6 text-[10px] text-destructive hover:bg-destructive/10" onClick={() => deleteShareMutation.mutate(s.id)}>Revoke</Button>
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
                        {catalogLoading ? <div className="p-4 text-xs text-center animate-pulse">Loading catalog...</div> : (
                          courses?.map(course => (
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
          <Button size="sm" variant="outline" className="h-9 w-full text-xs justify-start px-3 bg-background border border-border/40 shadow-sm hover:bg-accent/5 transition-all text-muted-foreground hover:text-foreground group" onClick={async () => {
            const res = await suggestTagsMutation.mutateAsync();
            setSuggestedTagsText(res.tags || []);
          }}>
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
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="p-0 w-[320px] border-l border-border/5 bg-background">
          <SheetHeader className="sr-only">
            <SheetTitle>Note Properties</SheetTitle>
          </SheetHeader>
          <div className="h-full">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      {content}
    </div>
  );
}
