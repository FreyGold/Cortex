"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  useCreateFolder,
  useCreateNote,
  useCreateTag,
  useNotesDashboard,
} from "@/hooks/use-notes";
import { CortexButton } from "@/components/ui/cortex-button";
import {
  CortexCard,
  CortexCardContent,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";

export function NotesDashboard() {
  const router = useRouter();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const dashboardQuery = useNotesDashboard();
  const createNote = useCreateNote();
  const createFolder = useCreateFolder();
  const createTag = useCreateTag();

  const notes = useMemo(() => {
    const allNotes = dashboardQuery.data?.notes ?? [];
    if (!selectedFolderId) return allNotes;
    return allNotes.filter((note) => note.folder_id === selectedFolderId);
  }, [dashboardQuery.data?.notes, selectedFolderId]);

  const onCreateNote = async () => {
    const created = await createNote.mutateAsync({
      title: "Untitled note",
      folderId: selectedFolderId,
    });
    router.push(`/notes/${created.id}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <CortexCard>
          <CortexCardHeader>
            <CortexCardTitle>Folders</CortexCardTitle>
          </CortexCardHeader>
          <CortexCardContent className="space-y-2">
            <button
              type="button"
              className={`block w-full rounded-md px-2 py-1 text-left text-sm ${!selectedFolderId ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
              onClick={() => setSelectedFolderId(null)}
            >
              All notes
            </button>
            {(dashboardQuery.data?.folders ?? []).map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`block w-full rounded-md px-2 py-1 text-left text-sm ${selectedFolderId === folder.id ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}
              >
                {folder.name}
              </button>
            ))}
            <div className="mt-3 flex gap-2">
              <input
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                placeholder="New folder"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <CortexButton
                size="sm"
                variant="outline"
                loading={createFolder.isPending}
                disabled={!newFolderName.trim()}
                onClick={async () => {
                  await createFolder.mutateAsync(newFolderName.trim());
                  setNewFolderName("");
                }}
              >
                Add
              </CortexButton>
            </div>
          </CortexCardContent>
        </CortexCard>

        <CortexCard>
          <CortexCardHeader>
            <CortexCardTitle>Tags</CortexCardTitle>
          </CortexCardHeader>
          <CortexCardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(dashboardQuery.data?.tags ?? []).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-border px-2 py-1 text-xs"
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newTagName}
                onChange={(event) => setNewTagName(event.target.value)}
                placeholder="New tag"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <CortexButton
                size="sm"
                variant="outline"
                loading={createTag.isPending}
                disabled={!newTagName.trim()}
                onClick={async () => {
                  await createTag.mutateAsync(newTagName.trim());
                  setNewTagName("");
                }}
              >
                Add
              </CortexButton>
            </div>
          </CortexCardContent>
        </CortexCard>
      </aside>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Recent notes</h2>
          <CortexButton onClick={onCreateNote} loading={createNote.isPending}>
            New note
          </CortexButton>
        </div>

        {dashboardQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : null}
        {dashboardQuery.isError ? (
          <p className="text-sm text-destructive">
            {(dashboardQuery.error as Error).message}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {notes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <CortexCard className="h-full transition-transform hover:-translate-y-0.5">
                <CortexCardHeader className="space-y-2">
                  <CortexCardTitle className="text-lg">{note.title}</CortexCardTitle>
                </CortexCardHeader>
                <CortexCardContent className="space-y-2">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {note.summary || note.content_text || "No content yet."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(note.updated_at).toLocaleString()}
                  </p>
                </CortexCardContent>
              </CortexCard>
            </Link>
          ))}
        </div>

        {!dashboardQuery.isLoading && !dashboardQuery.isError && notes.length === 0 ? (
          <CortexCard>
            <CortexCardContent className="pt-6 text-sm text-muted-foreground">
              No notes yet. Create your first note to start.
            </CortexCardContent>
          </CortexCard>
        ) : null}
      </section>
    </div>
  );
}
