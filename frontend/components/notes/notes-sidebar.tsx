"use client";

import {
  FolderOpen,
  FolderSimple,
  Plus,
  FileText,
  Tag as TagIcon,
  CaretRight,
  CaretDown,
  MagnifyingGlass,
  Sparkle,
  House
} from "@phosphor-icons/react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateFolder,
  useCreateNote,
  useCreateTag,
  useMoveFolder,
  useMoveNote,
  useNotesDashboard,
} from "@/hooks/use-notes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalAssistantModal } from "./global-assistant-modal";

function FolderNode({
  folder,
  allFolders,
  notes,
  depth = 0,
  activeNoteId,
  draggedItemId,
  setDraggedItemId,
  draggedItemType,
  setDraggedItemType,
  onDropItem,
  onCreateNoteInFolder,
}: any) {
  const [expanded, setExpanded] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const childFolders = allFolders.filter((f: any) => f.parent_id === folder.id);
  const folderNotes = notes.filter((n: any) => n.folder_id === folder.id);

  const handleDragStart = (
    e: React.DragEvent,
    id: string,
    type: "note" | "folder",
  ) => {
    e.stopPropagation();
    setDraggedItemId(id);
    setDraggedItemType(type);
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("id", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverOuter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItemType === "folder" && draggedItemId === folder.id) return;

    e.dataTransfer.dropEffect = "move";
    setIsOver(true);
  };

  const handleDragLeaveOuter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  const handleDropOuter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    const type = e.dataTransfer.getData("type");
    const id = e.dataTransfer.getData("id");

    if (type && id) {
      onDropItem(type, id, folder.id);
      setExpanded(true);
    }
  };

  return (
    <div
      className={cn(
        "space-y-0.5 transition-colors border border-transparent",
        isOver
          ? "bg-accent/40 shadow-sm border-border/50 rounded-md"
          : "border-transparent",
      )}
      onDragOver={handleDragOverOuter}
      onDragLeave={handleDragLeaveOuter}
      onDrop={handleDropOuter}
      role="group"
      aria-label={`Folder ${folder.name}`}
    >
      <div
        className={cn(
          "flex items-center rounded-md pr-2 py-1 text-sm font-medium cursor-pointer group transition-all relative",
          draggedItemId === folder.id
            ? "opacity-30 border-dashed"
            : "hover:bg-accent/50",
          isOver ? "text-foreground" : "text-foreground/80",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        draggable
        onDragStart={(e) => handleDragStart(e, folder.id, "folder")}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mr-1 p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground transition-transform shrink-0"
        >
          <CaretRight
            weight="bold"
            className={cn(
              "size-3 transition-transform",
              expanded ? "rotate-90" : "rotate-0",
              childFolders.length === 0 && folderNotes.length === 0
                ? "opacity-20"
                : "",
            )}
          />
        </button>
        <FolderSimple
          className={cn(
            "mr-2 size-4 shrink-0 transition-colors",
            isOver
              ? "fill-primary text-primary"
              : "text-muted-foreground group-hover:text-foreground",
          )}
          weight={isOver ? "fill" : "regular"}
        />
        <span
          className="whitespace-nowrap flex-1 font-semibold group-hover:underline decoration-muted-foreground/30 underline-offset-2 truncate"
          onClick={() => setExpanded(!expanded)}
        >
          {folder.name}
        </span>

        {isOver && (
          <span className="absolute right-2 text-[10px] uppercase font-bold text-primary animate-pulse pointer-events-none bg-background px-1 rounded border border-primary/20">
            Drop
          </span>
        )}

        {!isOver && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onCreateNoteInFolder(folder.id);
              setExpanded(true);
            }}
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 ml-1 shrink-0"
          >
            <Plus className="size-3" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="space-y-0.5 relative">
          <div 
            className="absolute top-1 bottom-1 border-l-2 border-border/20 pointer-events-none" 
            style={{ left: `${depth * 16 + 14}px` }} 
          />
          {childFolders.length === 0 && folderNotes.length === 0 && (
            <div
              className="py-1 text-[10px] text-muted-foreground/50 italic whitespace-nowrap"
              style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
            >
              Empty
            </div>
          )}
          {childFolders.map((child: any) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              notes={notes}
              depth={depth + 1}
              activeNoteId={activeNoteId}
              draggedItemId={draggedItemId}
              setDraggedItemId={setDraggedItemId}
              draggedItemType={draggedItemType}
              setDraggedItemType={setDraggedItemType}
              onDropItem={onDropItem}
              onCreateNoteInFolder={onCreateNoteInFolder}
            />
          ))}
          {folderNotes.map((note: any) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="block">
              <Button
                variant={activeNoteId === note.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start h-8 text-xs font-normal border border-transparent transition-all",
                  draggedItemId === note.id ? "opacity-30 border-dashed" : "",
                  activeNoteId === note.id
                    ? "bg-accent/80 font-medium text-primary shadow-sm"
                    : "hover:bg-accent/50",
                )}
                style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
                draggable
                onDragStart={(e) => handleDragStart(e, note.id, "note")}
              >
                <FileText
                  className={cn(
                    "mr-2 size-3.5 shrink-0",
                    activeNoteId === note.id
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span className="whitespace-nowrap truncate">
                  {note.title || "Untitled"}
                </span>
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotesSidebar() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string | undefined;

  const [newFolderName, setNewFolderName] = useState("");
  const [newTagName, setNewTagName] = useState("");

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<
    "note" | "folder" | null
  >(null);
  const [isRootOver, setIsRootOver] = useState(false);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedTag = searchParams.get("tag") || "";
  const initialQ = searchParams.get("q") || "";

  const [globalAssistantOpen, setGlobalAssistantOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialQ);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) params.set("q", searchQuery);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, pathname, router]);

  const handleTagClick = (tagName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedTag === tagName) params.delete("tag");
    else params.set("tag", tagName);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const dashboardQuery = useNotesDashboard();
  const createNote = useCreateNote();
  const createFolder = useCreateFolder();
  const createTag = useCreateTag();
  const moveNote = useMoveNote();
  const moveFolder = useMoveFolder();

  const handleDragStartNote = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedItemId(id);
    setDraggedItemType("note");
    e.dataTransfer.setData("type", "note");
    e.dataTransfer.setData("id", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsRootOver(true);
  };

  const handleDropItem = async (
    type: string,
    id: string,
    folderId: string | null,
  ) => {
    if (type === "note") {
      await moveNote.mutateAsync({ noteId: id, folderId });
    } else if (type === "folder") {
      if (id !== folderId) {
        try {
          await moveFolder.mutateAsync({ folderId: id, parentId: folderId });
        } catch (e) {
          console.error("Failed to move folder", e);
        }
      }
    }
    setDraggedItemId(null);
    setDraggedItemType(null);
  };

  const notes = dashboardQuery.data?.notes ?? [];
  const folders = dashboardQuery.data?.folders ?? [];

  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const rootFolders = folders.filter((f) => !f.parent_id);
  const unorganizedNotes = notes.filter((n) => !n.folder_id);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    await createFolder.mutateAsync(folderName.trim());
    setFolderName("");
    setIsFolderDialogOpen(false);
  };

  const filteredNotes = notes.filter((n) => 
    n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content_text?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="space-y-6">
      {/* Top Navigation Hooks */}
      <section className="space-y-2 pb-4 border-b border-border/10">
        <div className="px-2">
          <div className="flex items-center bg-accent/40 hover:bg-accent/60 transition-colors border border-transparent hover:border-border/30 rounded-md px-2 h-8">
            <MagnifyingGlass className="size-3.5 text-muted-foreground mr-2 shrink-0" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-full p-0 text-xs"
            />
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start h-8 text-xs font-semibold text-muted-foreground hover:bg-accent/50 group" 
          onClick={() => setGlobalAssistantOpen(true)}
        >
          <Sparkle className="mr-2 size-4 text-primary opacity-90 group-hover:opacity-100 transition-opacity shadow-sm" weight="fill" />
          <span className="text-primary/90 group-hover:text-primary transition-colors">Ask AI</span>
        </Button>
      </section>

      <GlobalAssistantModal 
        isOpen={globalAssistantOpen}
        onOpenChange={setGlobalAssistantOpen}
      />

      {searchQuery && (
        <section className="px-2 max-h-[30vh] overflow-y-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Search Results</div>
          {filteredNotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No notes found.</p>
          ) : (
            filteredNotes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <Button variant="ghost" className="w-full justify-start h-8 mb-1 px-2 items-center group">
                  <FileText className="mr-2 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="truncate text-xs font-medium w-full text-left">{note.title || "Untitled"}</span>
                </Button>
              </Link>
            ))
          )}
        </section>
      )}

      {/* Main Workspace (hidden if searching) */}
      {!searchQuery && (
        <>
          <section className="space-y-2">
        <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
          <div className="flex items-center gap-2">
            <FolderSimple size={12} weight="bold" />
            Workspace
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFolderDialogOpen(true)}
              className="size-5 hover:bg-accent/50 text-muted-foreground hover:text-foreground"
            >
              <Plus size={10} weight="bold" />
            </Button>
          </div>
        </div>

        <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your notes.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
              <Input
                placeholder="Folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFolderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!folderName.trim() || createFolder.isPending}
                onClick={handleCreateFolder}
              >
                {createFolder.isPending ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-1">
          <div
            className={cn(
              "space-y-0.5 rounded-lg transition-colors min-h-[5rem] pb-4",
              isRootOver ? "bg-accent/40 shadow-inner" : "",
            )}
            onDragOver={handleDragOverRoot}
            onDragLeave={() => setIsRootOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsRootOver(false);
              const type = e.dataTransfer.getData("type");
              const id = e.dataTransfer.getData("id");
              if (type && id) handleDropItem(type, id, null);
            }}
            role="group"
            aria-label="Workspace root"
          >
            <div className="space-y-0.5">
              {rootFolders.map((folder) => (
                <FolderNode
                  key={folder.id}
                  folder={folder}
                  allFolders={folders}
                  notes={notes}
                  depth={0}
                  activeNoteId={noteId}
                  draggedItemId={draggedItemId}
                  setDraggedItemId={setDraggedItemId}
                  draggedItemType={draggedItemType}
                  setDraggedItemType={setDraggedItemType}
                  onDropItem={handleDropItem}
                  onCreateNoteInFolder={async (fid: string) => {
                    const created = await createNote.mutateAsync({
                      title: "Untitled note",
                      folderId: fid,
                    });
                    router.push(`/notes/${created.id}`);
                  }}
                />
              ))}
            </div>

            <div className="space-y-0.5 mt-1">
              {unorganizedNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block"
                >
                  <Button
                    variant={noteId === note.id ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start h-8 text-xs font-normal border border-transparent transition-all",
                      draggedItemId === note.id
                        ? "opacity-30 border-dashed"
                        : "",
                      noteId === note.id
                        ? "bg-accent/80 font-medium text-primary shadow-sm"
                        : "hover:bg-accent/50",
                    )}
                    style={{ paddingLeft: "20px" }}
                    draggable
                    onDragStart={(e) => handleDragStartNote(e, note.id)}
                  >
                    <FileText
                      className={cn(
                        "mr-2 size-3.5 shrink-0",
                        noteId === note.id
                          ? "text-primary"
                          : "text-muted-foreground",
                      )}
                    />
                    <span className="whitespace-nowrap truncate max-w-[170px]">
                      {note.title || "Untitled"}
                    </span>
                  </Button>
                </Link>
              ))}
            </div>

            {isRootOver && (
              <div className="py-2 text-center text-[10px] uppercase font-bold tracking-wider text-primary animate-pulse bg-accent/30 rounded mt-2 border border-primary/20">
                Drop in root
              </div>
            )}
          </div>
        </div>

        {!createNote.isPending && (
          <div className="mt-2 px-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-xs font-normal text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 group"
              onClick={async () => {
                const created = await createNote.mutateAsync({
                  title: "Untitled note",
                });
                router.push(`/notes/${created.id}`);
              }}
            >
              <Plus className="mr-2 size-3.5 opacity-50 group-hover:opacity-100" />
              New page
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
          <TagIcon size={12} weight="bold" />
          Tags
        </div>
        <div className="flex flex-wrap gap-1.5 px-2">
          {(dashboardQuery.data?.tags ?? []).map((tag) => {
            const isSelected = selectedTag === tag.name;
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer rounded px-1.5 py-0 h-5 text-[10px] font-medium transition-colors",
                  isSelected 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "text-muted-foreground bg-accent/20 border-transparent hover:bg-accent/40"
                )}
                onClick={() => handleTagClick(tag.name)}
              >
                {tag.name}
              </Badge>
            );
          })}
          {!(dashboardQuery.data?.tags ?? []).length && (
            <p className="py-1 px-1 text-[10px] text-muted-foreground/40 italic">
              No tags indexed
            </p>
          )}
        </div>
      </section>
        </>
      )}
    </aside>
  );
}
