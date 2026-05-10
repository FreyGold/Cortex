"use client";

import { differenceInDays, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Archive,
  ChevronRight,
  Clock,
  FileText,
  Folder,
  RotateCcw,
  Trash2,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useArchivedItems,
  useDeleteFolderForever,
  useDeleteNoteForever,
  useRestoreFolder,
  useRestoreNote,
} from "@/hooks/use-notes";
import { cn } from "@/lib/utils";

function ArchivedItem({ item, type, onRestore, onDeleteForever }: any) {
  const archivedDate = item.archived_at
    ? new Date(item.archived_at)
    : new Date(item.updated_at || item.created_at);
  const daysSinceArchived = differenceInDays(new Date(), archivedDate);
  const daysLeft = Math.max(0, 30 - daysSinceArchived);
  const isWarning = daysLeft <= 3;

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-border/40 rounded-xl hover:border-border/80 transition-all gap-4">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="p-2 bg-muted/30 rounded-lg shrink-0 mt-0.5">
          {type === "folder" ? (
            <Folder className="size-4 text-primary/60" />
          ) : (
            <FileText className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1 overflow-hidden">
          <h3 className="font-semibold text-[15px] truncate">
            {item.name || item.title || "Untitled"}
          </h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Archived {formatDistanceToNow(archivedDate, { addSuffix: true })}
            </span>
            <span className="text-border/40">•</span>
            <span
              className={`flex items-center gap-1 font-medium ${isWarning ? "text-destructive/80" : "text-muted-foreground"}`}
            >
              {isWarning && <AlertTriangle className="size-3" />}
              {daysLeft} days left
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(item.id)}
          className="gap-2 h-9 px-4 rounded-lg bg-background hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-all"
        >
          <RotateCcw className="size-4" /> Restore
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeleteForever(item.id)}
          className="gap-2 h-9 px-4 rounded-lg bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
        >
          <Trash2 className="size-4" /> Delete Forever
        </Button>
      </div>
    </div>
  );
}

function ArchivedFolderNode({
  folder,
  allFolders,
  allNotes,
  depth,
  onRestoreNote,
  onDeleteNote,
  onRestoreFolder,
  onDeleteFolder,
}: any) {
  const [expanded, setExpanded] = useState(true);
  const children = useMemo(
    () => allFolders.filter((f: any) => f.parent_id === folder.id),
    [allFolders, folder.id],
  );
  const notes = useMemo(
    () => allNotes.filter((n: any) => n.folder_id === folder.id),
    [allNotes, folder.id],
  );

  if (children.length === 0 && notes.length === 0) {
    return (
      <ArchivedItem
        item={folder}
        type="folder"
        onRestore={onRestoreFolder}
        onDeleteForever={onDeleteFolder}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            expanded && "rotate-90",
          )}
        />
        <ArchivedItem
          item={folder}
          type="folder"
          onRestore={onRestoreFolder}
          onDeleteForever={onDeleteFolder}
          className="flex-1"
        />
      </div>

      {expanded && (
        <div className="pl-6 space-y-2 border-l-2 border-border/10 ml-6">
          {children.map((child: any) => (
            <ArchivedFolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              allNotes={allNotes}
              depth={depth + 1}
              onRestoreNote={onRestoreNote}
              onDeleteNote={onDeleteNote}
              onRestoreFolder={onRestoreFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
          {notes.map((note: any) => (
            <ArchivedItem
              key={note.id}
              item={note}
              type="note"
              onRestore={onRestoreNote}
              onDeleteForever={onDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArchivePage() {
  const archivedQuery = useArchivedItems();
  const restoreNote = useRestoreNote();
  const deleteNoteForever = useDeleteNoteForever();
  const restoreFolder = useRestoreFolder();
  const deleteFolderForever = useDeleteFolderForever();

  const notes = useMemo(
    () => archivedQuery.data?.notes ?? [],
    [archivedQuery.data],
  );
  const folders = useMemo(
    () => archivedQuery.data?.folders ?? [],
    [archivedQuery.data],
  );

  const rootArchivedNotes = useMemo(
    () =>
      notes.filter(
        (n) => !n.folder_id || !folders.some((f) => f.id === n.folder_id),
      ),
    [notes, folders],
  );
  const rootArchivedFolders = useMemo(
    () =>
      folders.filter(
        (f) => !f.parent_id || !folders.some((pf) => pf.id === f.parent_id),
      ),
    [folders],
  );

  const handleRestoreNote = async (id: string) => {
    await restoreNote.mutateAsync(id);
  };

  const handleDeleteNoteForever = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this note?")) {
      await deleteNoteForever.mutateAsync(id);
    }
  };

  const handleRestoreFolder = async (id: string) => {
    await restoreFolder.mutateAsync(id);
  };

  const handleDeleteFolderForever = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to permanently delete this folder and all its contents?",
      )
    ) {
      await deleteFolderForever.mutateAsync(id);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background/50 h-full">
      <div className="max-w-4xl mx-auto p-8 space-y-8 pb-20">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Archive className="size-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          </div>
          <p className="text-muted-foreground text-[15px]">
            Items in the archive will be permanently deleted after 30 days.
          </p>
        </div>

        {archivedQuery.isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/30 rounded-xl" />
            ))}
          </div>
        ) : notes.length === 0 && folders.length === 0 ? (
          <div className="text-center py-24 px-4 bg-accent/20 rounded-2xl border border-border/10">
            <Archive className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground/80 mb-2">
              Archive is empty
            </p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Items you archive will appear here for 30 days before being
              permanently deleted.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rootArchivedFolders.map((folder) => (
              <ArchivedFolderNode
                key={folder.id}
                folder={folder}
                allFolders={folders}
                allNotes={notes}
                depth={0}
                onRestoreNote={handleRestoreNote}
                onDeleteNote={handleDeleteNoteForever}
                onRestoreFolder={handleRestoreFolder}
                onDeleteFolder={handleDeleteFolderForever}
              />
            ))}
            {rootArchivedNotes.map((note) => (
              <ArchivedItem
                key={note.id}
                item={note}
                type="note"
                onRestore={handleRestoreNote}
                onDeleteForever={handleDeleteNoteForever}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
