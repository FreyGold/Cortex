"use client";

import { 
  FileQuestion as Placeholder, 
  Plus, 
  FileText, 
  Search, 
  Sparkles, 
  Tag as TagIcon,
  LayoutGrid,
  List as ListIcon,
  Clock,
  ArrowRight,
  Filter
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCreateNote, useNotesDashboard } from "@/hooks/use-notes";
import { cn } from "@/lib/utils";
import { GlobalAssistantModal } from "./global-assistant-modal";

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

export function NotesDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeTag, setActiveTag] = useState<string | null>(searchParams.get("tag") || null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const workspaceId = searchParams.get("workspaceId") || undefined;
  const dashboardQuery = useNotesDashboard(workspaceId);
  const createNote = useCreateNote();

  // Sync state with URL changes (e.g. from sidebar)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== searchQuery) setSearchQuery(q);
    
    const tag = searchParams.get("tag") || null;
    if (tag !== activeTag) setActiveTag(tag);
  }, [searchParams]);

  const notes = useMemo(() => {
    let data = (dashboardQuery.data?.notes ?? []).filter((n: any) => n.title !== "Introduction");
    const q = searchQuery.toLowerCase();
    if (q) {
      data = data.filter(n => 
        n.title?.toLowerCase().includes(q) || 
        n.summary?.toLowerCase().includes(q) || 
        n.content_text?.toLowerCase().includes(q)
      );
    }
    if (activeTag) {
      data = data.filter(n => 
        (n as any).note_tags?.some((nt: any) => nt.tags?.name === activeTag)
      );
    }
    return data;
  }, [dashboardQuery.data?.notes, searchQuery, activeTag]);

  const allTags = dashboardQuery.data?.tags ?? [];
  
  // Sort tags by frequency (number of notes using them)
  const sortedTags = useMemo(() => {
    const counts: Record<string, number> = {};
    (dashboardQuery.data?.notes ?? []).forEach((n: any) => {
      n.note_tags?.forEach((nt: any) => {
        counts[nt.tags.name] = (counts[nt.tags.name] || 0) + 1;
      });
    });
    return [...allTags].sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0));
  }, [allTags, dashboardQuery.data?.notes]);

  const visibleTags = sortedTags.slice(0, 6);
  const hiddenTags = sortedTags.slice(6);
  const isActiveTagHidden = activeTag && !visibleTags.some(t => t.name === activeTag);

  const onCreateNote = async () => {
    const created = await createNote.mutateAsync({
      title: "",
      workspaceId,
    });
    router.push(`/notes/${created.id}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      {/* HERO SECTION */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent">
              My Library
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Everything you've captured, synthesized, and organized.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                className="h-12 px-6 rounded-2xl gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                onClick={() => setAssistantOpen(true)}
             >
                <Sparkles className="size-4" />
                Ask Library
             </Button>
             <Button 
                className="h-12 px-6 rounded-2xl gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={onCreateNote}
                disabled={createNote.isPending}
             >
                <Plus className="size-5 stroke-[3]" />
                New Page
             </Button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col gap-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search notes, summaries, or content..." 
                className="h-14 pl-12 pr-4 rounded-2xl bg-muted/20 border-border/10 focus-visible:ring-primary/20 focus-visible:border-primary/30 text-lg transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Button 
                variant={!activeTag ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-full h-8 px-4 text-[11px] font-bold uppercase tracking-wider shrink-0"
                onClick={() => setActiveTag(null)}
              >
                All
              </Button>
              
              {visibleTags.map(tag => (
                <Button 
                    key={tag.id}
                    variant={activeTag === tag.name ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                        "rounded-full h-8 px-4 text-[11px] font-bold uppercase tracking-wider gap-2 shrink-0 transition-all",
                        activeTag === tag.name && "ring-1 ring-primary/20 shadow-sm"
                    )}
                    onClick={() => setActiveTag(tag.name === activeTag ? null : tag.name)}
                >
                    <div className="size-1.5 rounded-full" style={{ backgroundColor: tag.color || '#666' }} />
                    {tag.name}
                </Button>
              ))}

              {isActiveTagHidden && (
                <Button 
                    variant="secondary"
                    size="sm"
                    className="rounded-full h-8 px-4 text-[11px] font-bold uppercase tracking-wider gap-2 shrink-0 ring-1 ring-primary/20 shadow-sm"
                    onClick={() => setActiveTag(null)}
                >
                    <div className="size-1.5 rounded-full bg-primary" />
                    {activeTag}
                </Button>
              )}

              {hiddenTags.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full h-8 px-3 text-[11px] font-bold uppercase tracking-wider gap-1.5 text-muted-foreground shrink-0 hover:bg-accent/40">
                      <Filter className="size-3" />
                      More
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0 border-border/10 shadow-2xl" align="start">
                    <Command>
                      <CommandInput placeholder="Search tags..." className="h-9 text-xs" />
                      <CommandList>
                        <CommandEmpty className="text-[11px] py-4 text-center text-muted-foreground">No tags found.</CommandEmpty>
                        <CommandGroup heading="Other Tags">
                          {hiddenTags.map(tag => (
                            <CommandItem 
                              key={tag.id} 
                              className="text-xs py-2 gap-2"
                              onSelect={() => { setActiveTag(tag.name); }}
                            >
                              <div className="size-2 rounded-full" style={{ backgroundColor: tag.color || '#666' }} />
                              {tag.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
           </div>
        </div>
      </section>

      {/* CONTENT ACTIONS */}
      <div className="flex items-center justify-between border-b border-border/5 pb-4">
         <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
            <Clock className="size-3.5" />
            <span>{notes.length} Notes found</span>
         </div>
         <div className="flex items-center bg-muted/20 rounded-lg p-1 gap-1">
            <button 
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-background text-primary shadow-sm" : "text-muted-foreground/40 hover:text-foreground")}
            >
                <LayoutGrid className="size-4" />
            </button>
            <button 
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-background text-primary shadow-sm" : "text-muted-foreground/40 hover:text-foreground")}
            >
                <ListIcon className="size-4" />
            </button>
         </div>
      </div>

      {/* NOTES LIST */}
      {dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl opacity-10" />
          ))}
        </div>
      ) : dashboardQuery.isError ? (
        <div className="p-12 text-center rounded-3xl border border-destructive/10 bg-destructive/5">
           <p className="text-destructive font-semibold">{(dashboardQuery.error as Error).message}</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 rounded-3xl border border-dashed border-border/10 bg-muted/5">
          <div className="size-16 rounded-3xl bg-muted/10 flex items-center justify-center">
            <Placeholder className="size-8 text-muted-foreground/20" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-muted-foreground">No matches found</p>
            <p className="text-sm text-muted-foreground/40">Try adjusting your search or filters.</p>
          </div>
          <Button variant="outline" className="rounded-xl px-8" onClick={() => { setSearchQuery(""); setActiveTag(null); }}>
            Clear Filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`} className="group block h-full">
              <div className="flex flex-col h-full p-6 rounded-3xl border border-border/40 bg-card hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                   <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <FileText className="size-5" />
                   </div>
                   <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                      {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                   </div>
                </div>
                
                <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                   {note.title || "Untitled"}
                </h3>
                
                <p className="text-sm text-muted-foreground/70 leading-relaxed line-clamp-3 mb-6 flex-1">
                   {note.summary || note.content_text || "No content captured yet."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border/5">
                   <div className="flex -space-x-1">
                      {(note as any).note_tags?.slice(0, 3).map((nt: any) => (
                        <div key={nt.tags.id} className="size-2.5 rounded-full border-2 border-card" style={{ backgroundColor: nt.tags.color }} />
                      ))}
                   </div>
                   <ArrowRight className="size-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`}>
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-muted/10 transition-all group border border-transparent hover:border-border/10">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-muted/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-all">
                      {note.title || "Untitled"}
                    </span>
                    <span className="text-xs text-muted-foreground/60 truncate max-w-xl">
                      {note.summary || note.content_text || "Empty note"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 ml-4">
                    <div className="flex gap-1.5">
                        {(note as any).note_tags?.slice(0, 2).map((nt: any) => (
                            <Badge key={nt.tags.id} variant="outline" className="text-[9px] uppercase font-bold h-5 px-1.5 border-border/40 text-muted-foreground/60">
                                {nt.tags.name}
                            </Badge>
                        ))}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground/40 whitespace-nowrap w-24 text-right">
                        {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <GlobalAssistantModal isOpen={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  );
}
