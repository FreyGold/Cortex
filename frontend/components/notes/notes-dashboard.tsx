"use client";

import { Placeholder, Plus } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateNote, useNotesDashboard } from "@/hooks/use-notes";

export function NotesDashboard() {
  const router = useRouter();

  const dashboardQuery = useNotesDashboard();
  const createNote = useCreateNote();

  const notes = useMemo(() => {
    return dashboardQuery.data?.notes ?? [];
  }, [dashboardQuery.data?.notes]);

  const onCreateNote = async () => {
    const created = await createNote.mutateAsync({
      title: "Untitled note",
    });
    router.push(`/notes/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
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
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {dashboardQuery.isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-6 text-center text-sm text-destructive font-medium">
            {(dashboardQuery.error as Error).message}
          </CardContent>
        </Card>
      )}

      {!dashboardQuery.isLoading && !dashboardQuery.isError && (
        <div className="grid gap-4 lg:grid-cols-2">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card className="h-full border-border/50 shadow-none hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {note.title || "Untitled"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                    {note.summary || note.content_text || "Empty note"}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Updated {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {notes.length === 0 && (
            <Card className="col-span-full border-dashed shadow-none bg-muted/20">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <Placeholder className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No notes found in this folder.
                </p>
                <Button variant="outline" size="sm" onClick={onCreateNote}>
                  Create your first note
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
