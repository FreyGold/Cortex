"use client";

import { Placeholder, Plus, FileText } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateNote, useNotesDashboard } from "@/hooks/use-notes";

export function NotesDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.toLowerCase() || "";
  const selectedTag = searchParams.get("tag") || "";

  const dashboardQuery = useNotesDashboard();
  const createNote = useCreateNote();

  const notes = useMemo(() => {
    let data = dashboardQuery.data?.notes ?? [];
    if (q) {
      data = data.filter(n => 
        n.title?.toLowerCase().includes(q) || 
        n.summary?.toLowerCase().includes(q) || 
        n.content_text?.toLowerCase().includes(q)
      );
    }
    if (selectedTag) {
      data = data.filter(n => 
        (n as any).note_tags?.some((nt: any) => nt.tags?.name === selectedTag)
      );
    }
    return data;
  }, [dashboardQuery.data?.notes, q, selectedTag]);

  const onCreateNote = async () => {
    const created = await createNote.mutateAsync({
      title: "Untitled note",
    });
    router.push(`/notes/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent notes</h2>
          <p className="text-sm text-muted-foreground">
            Manage and organize your knowledge base.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onCreateNote}
          disabled={createNote.isPending}
        >
          <Plus className="mr-2 size-4" />
          {createNote.isPending ? "Creating..." : "New note"}
        </Button>
      </div>

      {dashboardQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {dashboardQuery.isError && (
        <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-sm text-destructive font-medium">
          {(dashboardQuery.error as Error).message}
        </div>
      )}

      {!dashboardQuery.isLoading && !dashboardQuery.isError && (
        <div className="flex flex-col gap-1">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group border border-transparent hover:border-border/30">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center size-8 rounded-md bg-accent/30 text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {note.title || "Untitled"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {note.summary || note.content_text || "Empty note"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground/60 whitespace-nowrap ml-4 shrink-0">
                  {new Date(note.updated_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 rounded-lg border border-dashed border-border/50 bg-muted/10">
              <Placeholder className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No notes found in this folder.
              </p>
              <Button variant="outline" size="sm" onClick={onCreateNote}>
                Create your first note
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
