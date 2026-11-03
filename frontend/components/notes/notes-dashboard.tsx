"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  FileText,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Pin,
  FileQuestion as Placeholder,
  Plus,
  Search,
  Share2,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArchiveNote,
  useCreateNote,
  useNotesDashboard,
  useUpdateNote,
} from "@/hooks/use-notes";
import { cn } from "@/lib/utils";
import { GlobalAssistantModal } from "./global-assistant-modal";

// Animation variants for card list entry
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 22 },
  },
};

export function NotesDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeTag, setActiveTag] = useState<string | null>(
    searchParams.get("tag") || null,
  );
  const [assistantOpen, setAssistantOpen] = useState(false);

  const workspaceId = searchParams.get("workspaceId") || undefined;
  const dashboardQuery = useNotesDashboard(workspaceId);
  const createNote = useCreateNote();

  // Sync state with URL changes (e.g. from sidebar)
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only sync when searchParams (URL) changes, typing is local state.
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== searchQuery) setSearchQuery(q);

    const tag = searchParams.get("tag") || null;
    if (tag !== activeTag) setActiveTag(tag);
  }, [searchParams]);

  // Keyboard shortcut to focus search input when pressing "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        document.activeElement?.getAttribute("contenteditable") !== "true"
      ) {
        e.preventDefault();
        const searchInput = document.getElementById("dashboard-search-input");
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const notes = useMemo(() => {
    let data = (dashboardQuery.data?.notes ?? []).filter(
      (n: any) => n.title !== "Introduction",
    );
    const q = searchQuery.toLowerCase();
    if (q) {
      data = data.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.summary?.toLowerCase().includes(q) ||
          n.content_text?.toLowerCase().includes(q),
      );
    }
    if (activeTag) {
      data = data.filter((n) =>
        (n as any).note_tags?.some((nt: any) => nt.tags?.name === activeTag),
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
    return [...allTags].sort(
      (a, b) => (counts[b.name] || 0) - (counts[a.name] || 0),
    );
  }, [allTags, dashboardQuery.data?.notes]);

  const visibleTags = sortedTags.slice(0, 6);
  const hiddenTags = sortedTags.slice(6);
  const isActiveTagHidden =
    activeTag && !visibleTags.some((t) => t.name === activeTag);

  // Split notes into pinned and remaining lists for a better dashboard layout
  const pinnedNotes = useMemo(() => notes.filter((n) => n.is_pinned), [notes]);
  const remainingNotes = useMemo(
    () => notes.filter((n) => !n.is_pinned),
    [notes],
  );

  const showPinnedSection =
    !searchQuery && !activeTag && pinnedNotes.length > 0;
  const mainNotesList = showPinnedSection ? remainingNotes : notes;

  // Calculate high-level stats for the visual dashboard cards
  const stats = useMemo(() => {
    const total = notes.length;
    const pinned = notes.filter((n) => n.is_pinned).length;
    const aiSummarized = notes.filter((n) => n.summary).length;
    const totalTags = allTags.length;
    return { total, pinned, aiSummarized, totalTags };
  }, [notes, allTags]);

  const onCreateNote = async () => {
    const created = await createNote.mutateAsync({
      title: "",
      workspaceId,
    });
    router.push(
      `/notes/${created.id}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`,
    );
  };

  return (
    <div className="relative max-w-6xl mx-auto space-y-10 pb-20">
      {/* HERO SECTION */}
      <section className="space-y-6 pt-4 relative z-10">
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
              className="h-12 px-6 rounded-2xl gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all shadow-sm font-semibold"
              onClick={() => setAssistantOpen(true)}
            >
              <Sparkles className="size-4" />
              Ask Library
            </Button>
            <Button
              className="h-12 px-6 rounded-2xl gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold"
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
              id="dashboard-search-input"
              placeholder="Search notes, summaries, or content..."
              className="h-14 pl-12 pr-14 rounded-2xl bg-muted/20 border-border/10 focus-visible:ring-primary/20 focus-visible:border-primary/30 text-lg transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Keyboard shortcut or Clear button inside search input */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground/60 hover:text-foreground transition-all"
                  title="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="h-6 px-1.5 rounded border border-border/40 bg-muted/30 text-[10px] font-bold text-muted-foreground/60 flex items-center justify-center shadow-sm pointer-events-none select-none">
                  /
                </kbd>
              )}
            </div>
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

            {visibleTags.map((tag) => {
              const isSelected = activeTag === tag.name;
              return (
                <Button
                  key={tag.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "rounded-full h-8 px-4 text-[11px] font-bold uppercase tracking-wider gap-2 shrink-0 transition-all",
                    isSelected && "ring-1 ring-primary/20 shadow-sm",
                  )}
                  style={{
                    backgroundColor: isSelected
                      ? `${tag.color || "#666"}15`
                      : undefined,
                    borderColor: isSelected
                      ? tag.color || undefined
                      : undefined,
                    color: isSelected ? tag.color || undefined : undefined,
                  }}
                  onClick={() =>
                    setActiveTag(tag.name === activeTag ? null : tag.name)
                  }
                >
                  <div
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: tag.color || "#666" }}
                  />
                  {tag.name}
                </Button>
              );
            })}

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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full h-8 px-3 text-[11px] font-bold uppercase tracking-wider gap-1.5 text-muted-foreground shrink-0 hover:bg-accent/40"
                  >
                    <Filter className="size-3" />
                    More
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 p-0 border-border/10 shadow-2xl"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Search tags..."
                      className="h-9 text-xs"
                    />
                    <CommandList>
                      <CommandEmpty className="text-[11px] py-4 text-center text-muted-foreground">
                        No tags found.
                      </CommandEmpty>
                      <CommandGroup heading="Other Tags">
                        {hiddenTags.map((tag) => (
                          <CommandItem
                            key={tag.id}
                            className="text-xs py-2 gap-2"
                            onSelect={() => {
                              setActiveTag(tag.name);
                            }}
                          >
                            <div
                              className="size-2 rounded-full"
                              style={{ backgroundColor: tag.color || "#666" }}
                            />
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

      {/* QUICK STATS METRICS GRID */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="group/stat relative p-5 rounded-2xl border border-border/40 bg-card hover:border-primary/20 transition-all hover:shadow-[0_8px_20px_-6px_rgba(91,76,219,0.08)] overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/5 text-primary">
              <FileText className="size-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Total Notes
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.total}
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-1">
            Captured items in library
          </p>
        </div>

        <div className="group/stat relative p-5 rounded-2xl border border-border/40 bg-card hover:border-brand/20 transition-all hover:shadow-[0_8px_20px_-6px_rgba(91,76,219,0.08)] overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-brand/5 text-brand">
              <Pin className="size-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Pinned Docs
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.pinned}
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-1">
            Starred for quick access
          </p>
        </div>

        <div className="group/stat relative p-5 rounded-2xl border border-border/40 bg-card hover:border-synapse/20 transition-all hover:shadow-[0_8px_20px_-6px_rgba(91,76,219,0.08)] overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-synapse/5 text-synapse">
              <Sparkles className="size-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              AI Summarized
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.aiSummarized}
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-1">
            Synthesized by Cortex AI
          </p>
        </div>

        <div className="group/stat relative p-5 rounded-2xl border border-border/40 bg-card hover:border-axon/20 transition-all hover:shadow-[0_8px_20px_-6px_rgba(91,76,219,0.08)] overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-axon/5 text-axon">
              <TagIcon className="size-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
              Active Tags
            </span>
          </div>
          <div className="text-2xl font-extrabold tracking-tight">
            {stats.totalTags}
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-1">
            Categorized topics
          </p>
        </div>
      </section>

      {/* PINNED SECTION (Only shown when not searching/filtering and pinned notes exist) */}
      {showPinnedSection && (
        <section className="space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50 pl-1">
            <Pin className="size-3.5 text-brand" />
            <span>Pinned Documents</span>
          </div>
          {viewMode === "grid" ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {pinnedNotes.map((note) => (
                <motion.div key={note.id} variants={itemVariants} layout>
                  <NoteCard note={note} workspaceId={workspaceId} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-2"
            >
              {pinnedNotes.map((note) => (
                <motion.div key={note.id} variants={itemVariants} layout>
                  <NoteRow note={note} workspaceId={workspaceId} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      )}

      {/* CONTENT ACTIONS & MAIN NOTES HEADER */}
      <div className="flex items-center justify-between border-b border-border/5 pb-4 relative z-10">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/40 pl-1">
          <Clock className="size-3.5" />
          <span>
            {searchQuery || activeTag
              ? `${notes.length} matches found`
              : showPinnedSection
                ? "Recent Library Items"
                : `${notes.length} Notes found`}
          </span>
        </div>
        <div className="flex items-center bg-muted/20 rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-md transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.95]",
              viewMode === "grid"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground/40 hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.95]",
              viewMode === "list"
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground/40 hover:text-foreground",
            )}
          >
            <ListIcon className="size-4" />
          </button>
        </div>
      </div>

      {/* NOTES LIST */}
      <div className="relative z-10">
        {dashboardQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-60 w-full rounded-3xl border border-border/40 bg-card p-6 flex flex-col justify-between overflow-hidden relative opacity-60"
              >
                <div className="flex justify-between items-center">
                  <Skeleton className="size-10 rounded-2xl bg-muted/30" />
                  <Skeleton className="h-4 w-16 bg-muted/30" />
                </div>
                <div className="space-y-3 flex-1 mt-6">
                  <Skeleton className="h-5 w-3/4 bg-muted/30" />
                  <Skeleton className="h-4 w-full bg-muted/30" />
                  <Skeleton className="h-4 w-5/6 bg-muted/30" />
                </div>
                <div className="flex justify-between items-center border-t border-border/5 pt-4 mt-6">
                  <Skeleton className="h-4 w-20 bg-muted/30" />
                  <Skeleton className="size-4 rounded-full bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        ) : dashboardQuery.isError ? (
          <div className="p-12 text-center rounded-3xl border border-destructive/10 bg-destructive/5">
            <p className="text-destructive font-semibold">
              {(dashboardQuery.error as Error).message}
            </p>
          </div>
        ) : mainNotesList.length === 0 ? (
          <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center space-y-6 rounded-3xl border border-dashed border-border/20 bg-muted/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 relative z-10 border border-primary/10 shadow-sm animate-pulse">
              <Placeholder className="size-8 stroke-[1.5]" />
            </div>
            <div className="space-y-2 relative z-10 max-w-sm">
              <h3 className="text-lg font-bold text-foreground">
                No notes found
              </h3>
              <p className="text-sm text-muted-foreground/60 leading-relaxed">
                {searchQuery || activeTag
                  ? "We couldn't find any notes matching your current filters. Try refining your keywords or clearing the search."
                  : "Your library is empty. Let's create your first note to start capturing information!"}
              </p>
            </div>
            <div className="relative z-10 flex gap-3">
              {searchQuery || activeTag ? (
                <Button
                  variant="outline"
                  className="rounded-xl px-6 h-10 border-border hover:bg-muted/80 text-xs font-semibold"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTag(null);
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  className="rounded-xl px-6 h-10 bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/15"
                  onClick={onCreateNote}
                  disabled={createNote.isPending}
                >
                  Create a Note
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {mainNotesList.map((note) => (
              <motion.div key={note.id} variants={itemVariants} layout>
                <NoteCard note={note} workspaceId={workspaceId} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-2"
          >
            {mainNotesList.map((note) => (
              <motion.div key={note.id} variants={itemVariants} layout>
                <NoteRow note={note} workspaceId={workspaceId} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <GlobalAssistantModal
        isOpen={assistantOpen}
        onOpenChange={setAssistantOpen}
      />
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function NoteCard({ note, workspaceId }: { note: any; workspaceId?: string }) {
  const updateNote = useUpdateNote(note.id);
  const archiveNote = useArchiveNote();

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await updateNote.mutateAsync({ isPinned: !note.is_pinned });
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to archive this note?")) {
      await archiveNote.mutateAsync(note.id);
    }
  };

  // Estimate word count and reading time dynamically
  const wordCount = useMemo(() => {
    if (!note.content_text) return 0;
    return note.content_text.trim().split(/\s+/).filter(Boolean).length;
  }, [note.content_text]);

  const readingTime = useMemo(() => {
    return Math.max(1, Math.round(wordCount / 200));
  }, [wordCount]);

  const formattedDate = useMemo(() => {
    return new Date(note.updated_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, [note.updated_at]);

  return (
    <Link
      href={`/notes/${note.id}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`}
      className="group/card block h-full active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      <div className="relative flex flex-col h-full p-6 rounded-2xl border border-border/30 bg-card/65 backdrop-blur-md hover:border-primary/25 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] overflow-hidden">
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover/card:bg-primary group-hover/card:text-primary-foreground transition-all duration-300 shadow-sm">
            <FileText className="size-5 shrink-0" />
          </div>

          {/* Right side: show date/reading-time, swap with actions on hover */}
          <div className="relative h-10 w-24 flex items-center justify-end">
            {/* Date & Reading time (visible by default) */}
            <div className="flex flex-col items-end text-[10px] font-bold uppercase tracking-wider text-muted-foreground/30 group-hover/card:opacity-0 transition-opacity duration-200">
              <span>{formattedDate}</span>
              <span className="flex items-center gap-0.5 mt-0.5">
                <Clock className="size-2.5" /> {readingTime} min
              </span>
            </div>

            {/* Actions (visible on hover) */}
            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={handleTogglePin}
                className={cn(
                  "p-1.5 rounded-xl border border-border/50 bg-background/85 backdrop-blur-sm shadow-sm transition-all hover:scale-105 active:scale-95",
                  note.is_pinned
                    ? "text-brand border-brand/20 bg-brand/5"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={note.is_pinned ? "Unpin note" : "Pin note"}
              >
                <Pin
                  className={cn("size-3.5", note.is_pinned && "fill-brand")}
                />
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="p-1.5 rounded-xl border border-border/50 bg-background/85 backdrop-blur-sm shadow-sm text-muted-foreground hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5 transition-all hover:scale-105 active:scale-95"
                title="Archive note"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* AI summary badge if synthesized */}
        {note.summary && (
          <div className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-synapse relative z-10">
            <Sparkles className="size-3 text-synapse fill-synapse/15" />
            <span>AI Summarized</span>
          </div>
        )}

        <h3 className="text-lg font-bold leading-tight mb-2 group-hover/card:text-primary transition-colors duration-200 line-clamp-2 relative z-10 text-foreground">
          {note.title || "Untitled Note"}
        </h3>

        <p className="text-sm text-muted-foreground/60 leading-relaxed line-clamp-3 mb-6 flex-1 relative z-10">
          {note.summary || note.content_text || "No content captured yet."}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border/5 relative z-10 mt-auto">
          {/* Tag Pills */}
          <div className="flex flex-wrap gap-1 max-w-[80%]">
            {note.note_tags && note.note_tags.length > 0 ? (
              note.note_tags.slice(0, 2).map((nt: any) => (
                <span
                  key={nt.tags.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all"
                  style={{
                    backgroundColor: `${nt.tags.color}12`,
                    borderColor: `${nt.tags.color}25`,
                    color: nt.tags.color || "#666",
                  }}
                >
                  {nt.tags.name}
                </span>
              ))
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground/30">
                No tags
              </span>
            )}
            {note.note_tags && note.note_tags.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground/60">
                +{note.note_tags.length - 2}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {note.is_published && (
              <span
                className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                title="Published"
              >
                <Share2 className="size-3" />
              </span>
            )}
            <ArrowRight className="size-4 text-muted-foreground/20 group-hover/card:text-primary group-hover/card:translate-x-0.5 transition-all duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function NoteRow({ note, workspaceId }: { note: any; workspaceId?: string }) {
  const updateNote = useUpdateNote(note.id);
  const archiveNote = useArchiveNote();

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await updateNote.mutateAsync({ isPinned: !note.is_pinned });
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to archive this note?")) {
      await archiveNote.mutateAsync(note.id);
    }
  };

  const formattedDate = useMemo(() => {
    return new Date(note.updated_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, [note.updated_at]);

  return (
    <Link
      href={`/notes/${note.id}${workspaceId ? `?workspaceId=${workspaceId}` : ""}`}
      className="group/row block animate-in fade-in duration-200"
    >
      <div className="relative flex items-center justify-between p-4 rounded-xl hover:bg-primary/5 transition-all duration-200 group border border-transparent hover:border-primary/10 active:scale-[0.995] overflow-hidden">
        <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10 pl-2">
          <div className="flex items-center justify-center size-10 rounded-xl bg-muted/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
            <FileText className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              {note.is_pinned && (
                <Pin className="size-3 text-brand fill-brand shrink-0" />
              )}
              <span className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-all">
                {note.title || "Untitled Note"}
              </span>
              {note.summary && (
                <Badge
                  variant="outline"
                  className="text-[8px] uppercase font-bold tracking-wider h-4 border-synapse/35 text-synapse bg-synapse/5 py-0 px-1 shrink-0"
                >
                  AI Summary
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground/60 truncate max-w-xl">
              {note.summary || note.content_text || "Empty note"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-4 relative z-10">
          {/* Tags */}
          <div className="flex gap-1">
            {note.note_tags?.slice(0, 2).map((nt: any) => (
              <Badge
                key={nt.tags.id}
                variant="outline"
                className="text-[9px] uppercase font-bold h-5 px-1.5 border-border/40 text-muted-foreground/60 transition-all"
                style={{
                  backgroundColor: `${nt.tags.color}08`,
                  borderColor: `${nt.tags.color}20`,
                  color: nt.tags.color || "#666",
                }}
              >
                {nt.tags.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3 h-8 w-24 justify-end relative">
            {/* Date (visible by default) */}
            <span className="text-[11px] font-medium text-muted-foreground/40 whitespace-nowrap group-hover/row:opacity-0 transition-opacity duration-200">
              {formattedDate}
            </span>

            {/* Hover Actions */}
            <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200">
              {note.is_published && (
                <span className="p-1 text-emerald-500 mr-0.5" title="Published">
                  <Share2 className="size-3.5" />
                </span>
              )}
              <button
                type="button"
                onClick={handleTogglePin}
                className={cn(
                  "p-1.5 rounded-lg border border-border bg-background shadow-sm hover:scale-105 active:scale-95 transition-all",
                  note.is_pinned
                    ? "text-brand border-brand/20 bg-brand/5"
                    : "text-muted-foreground hover:text-foreground",
                )}
                title={note.is_pinned ? "Unpin note" : "Pin note"}
              >
                <Pin className={cn("size-3", note.is_pinned && "fill-brand")} />
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="p-1.5 rounded-lg border border-border bg-background shadow-sm text-muted-foreground hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5 hover:scale-105 active:scale-95 transition-all"
                title="Archive note"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
