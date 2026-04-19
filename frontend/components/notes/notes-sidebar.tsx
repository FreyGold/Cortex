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
import { Trash2 } from "lucide-react";
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
  useArchivedNotes,
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

  const handleDragStart = (e: React.DragEvent, id: string, type: "note" | "folder") => {
    e.stopPropagation();
    setDraggedItemId(id);
    setDraggedItemType(type);
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("id", id);
  };

  const hasActiveNote = useMemo(() => {
    if (activeNoteId && folderNotes.some((n: any) => n.id === activeNoteId)) return true;
    return false;
  }, [activeNoteId, folderNotes]);

  useEffect(() => {
    if (hasActiveNote) setExpanded(true);
  }, [hasActiveNote]);


  return (
    <div
      className={cn("space-y-0.5", isOver && "bg-accent/40 rounded-md border border-border/50")}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setIsOver(false);
        const type = e.dataTransfer.getData("type");
        const id = e.dataTransfer.getData("id");
        if (type && id) onDropItem(type, id, folder.id);
      }}
    >
      <div
        className={cn(
          "flex items-center rounded-md pr-2 py-1 text-sm font-medium cursor-pointer group transition-all",
          activeNoteId === folder.id ? "bg-accent text-primary" : "text-muted-foreground hover:bg-accent/50",
          draggedItemId === folder.id && "opacity-30"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        draggable
        onDragStart={(e) => handleDragStart(e, folder.id, "folder")}
      >
        <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="mr-1 p-0.5 rounded hover:bg-muted-foreground/20 text-muted-foreground transition-transform">
          <CaretRight weight="bold" className={cn("size-3", expanded && "rotate-90", (childFolders.length === 0 && folderNotes.length === 0) && "opacity-20")} />
        </button>
        <FolderSimple className={cn("mr-2 size-4 text-muted-foreground group-hover:text-foreground", isOver && "text-primary")} />
        <span className="truncate flex-1 font-semibold" onClick={() => setExpanded(!expanded)}>{folder.name}</span>
        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 ml-1" onClick={(e) => { e.stopPropagation(); onCreateNoteInFolder(folder.id); setExpanded(true); }}>
          <Plus className="size-3" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-0.5 relative">
          {childFolders.map((child: any) => (
            <FolderNode key={child.id} folder={child} allFolders={allFolders} notes={notes} depth={depth + 1} activeNoteId={activeNoteId} onDropItem={onDropItem} onCreateNoteInFolder={onCreateNoteInFolder} setDraggedItemId={setDraggedItemId} setDraggedItemType={setDraggedItemType} draggedItemId={draggedItemId} />
          ))}
          {folderNotes.map((note: any) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="block">
              <Button
                variant={activeNoteId === note.id ? "secondary" : "ghost"}
                size="sm"
                className={cn("w-full justify-start h-8 text-xs font-normal border border-transparent transition-all", activeNoteId === note.id ? "bg-accent/80 font-medium text-primary shadow-sm" : "hover:bg-accent/50")}
                style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
                draggable
                onDragStart={(e) => handleDragStart(e, note.id, "note")}
              >
                <FileText className={cn("mr-2 size-3.5", activeNoteId === note.id ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{note.title || "Untitled"}</span>
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
  const activeNoteId = params.id as string | undefined;

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedTag = searchParams.get("tag") || "";
  const initialQ = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [globalAssistantOpen, setGlobalAssistantOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showTrash, setShowTrash] = useState(false);

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<"note" | "folder" | null>(null);
  const [isRootOver, setIsRootOver] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (searchQuery) p.set("q", searchQuery); else p.delete("q");
      router.replace(`${pathname}?${p.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, pathname, router]);

  const dashboardQuery = useNotesDashboard();
  const archivedQuery = useArchivedNotes();
  const createNote = useCreateNote();
  const createFolder = useCreateFolder();
  const moveNote = useMoveNote();
  const moveFolder = useMoveFolder();

  const handleDropItem = async (type: string, id: string, folderId: string | null) => {
    if (type === "note") await moveNote.mutateAsync({ noteId: id, folderId });
    else if (type === "folder" && id !== folderId) await moveFolder.mutateAsync({ folderId: id, parentId: folderId });
    setDraggedItemId(null); setDraggedItemType(null);
  };

  const notes = dashboardQuery.data?.notes ?? [];
  const folders = dashboardQuery.data?.folders ?? [];

  const rootFolders = folders.filter((f) => !f.parent_id);
  const unorganizedNotes = notes.filter((n) => !n.folder_id);

  const filteredNotes = notes.filter(n => n.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <aside className="space-y-6 flex flex-col h-full bg-background/50 backdrop-blur-xl">
      {/* SEARCH & AI */}
      <section className="space-y-2 px-2 pt-2">
        <div className="flex items-center bg-muted/20 hover:bg-muted/40 transition-all border border-border/40 rounded-xl px-3 h-10 shadow-inner group">
          <MagnifyingGlass className="size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 h-full p-2 text-xs font-medium"
          />
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start h-10 text-xs font-bold text-primary hover:bg-primary/5 rounded-xl group relative overflow-hidden" 
          onClick={() => setGlobalAssistantOpen(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkle className="mr-2 size-4 group-hover:scale-110 transition-transform" weight="fill" />
          Neural Research Assistant
        </Button>
      </section>

      {/* WORKSPACE */}
      <section className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar">
        {!searchQuery && (
          <>
            <div className="flex items-center justify-between px-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/40">
              <span className="flex items-center gap-1.5"><FolderOpen size={12} weight="bold" /> Workspace</span>
              <Button variant="ghost" size="icon" onClick={() => setIsFolderDialogOpen(true)} className="size-6 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                <Plus size={12} weight="bold" />
              </Button>
            </div>

            <div className="space-y-0.5 min-h-[100px]" onDragOver={(e) => { e.preventDefault(); setIsRootOver(true); }} onDragLeave={() => setIsRootOver(false)} onDrop={(e) => { e.preventDefault(); setIsRootOver(false); const t = e.dataTransfer.getData("type"); const id = e.dataTransfer.getData("id"); if (t && id) handleDropItem(t, id, null); }}>
              {rootFolders.map((f) => (
               <FolderNode key={f.id} folder={f} allFolders={folders} notes={notes} activeNoteId={activeNoteId} onDropItem={handleDropItem} onCreateNoteInFolder={async (fid: string) => { const c = await createNote.mutateAsync({ title: "Untitled note", folderId: fid }); router.push(`/notes/${c.id}`); }} setDraggedItemId={setDraggedItemId} setDraggedItemType={setDraggedItemType} draggedItemId={draggedItemId} />
              ))}
              {unorganizedNotes.map((n) => (
                <Link key={n.id} href={`/notes/${n.id}`}>
                  <Button variant={activeNoteId === n.id ? "secondary" : "ghost"} size="sm" className={cn("w-full justify-start h-8 text-xs font-normal transition-all", activeNoteId === n.id ? "bg-accent font-semibold text-primary" : "hover:bg-accent/40")} style={{ paddingLeft: "20px" }} draggable onDragStart={(e) => { setDraggedItemId(n.id); e.dataTransfer.setData("id", n.id); e.dataTransfer.setData("type", "note"); }}>
                    <FileText className={cn("mr-2 size-3.5", activeNoteId === n.id ? "text-primary" : "text-muted-foreground/60")} />
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* FOOTER ACTIONS (TRASH, TAGS) */}
      <section className="mt-auto border-t border-border/10 p-2 space-y-2 pb-6">
        <Button 
          variant="ghost" 
          className="w-full justify-start h-9 text-[11px] font-semibold text-muted-foreground/60 hover:text-foreground hover:bg-accent/40 rounded-lg group"
          onClick={() => setShowTrash(!showTrash)}
        >
          <Trash2 className={cn("mr-2 size-3.5 transition-colors", showTrash && "text-destructive")} />
          {showTrash ? "Hide Trash" : "View Trash"}
          {archivedQuery.data && archivedQuery.data.length > 0 && <Badge className="ml-auto text-[8px] h-4 min-w-4 px-1 bg-muted-foreground/20 text-muted-foreground border-none">{archivedQuery.data.length}</Badge>}
        </Button>

        {showTrash && (
          <div className="space-y-0.5 mb-2 max-h-[200px] overflow-y-auto p-1 bg-muted/10 rounded-lg border border-border/20 custom-scrollbar">
            {archivedQuery.data?.length ? archivedQuery.data.map(n => (
              <div key={n.id} className="text-[10px] py-1.5 px-2 flex items-center justify-between group/trash rounded hover:bg-destructive/5 transition-colors">
                <span className="truncate flex-1 font-medium opacity-60 group-hover/trash:opacity-90">{n.title || "Untitled note"}</span>
                <span className="text-[8px] opacity-30 ml-2 whitespace-nowrap">{new Date(n.archived_at!).toLocaleDateString()}</span>
              </div>
            )) : <p className="text-[10px] text-center py-6 opacity-30 italic">Trash is empty</p>}
          </div>
        )}

        <Button 
          className="w-full justify-start h-10 text-xs font-bold bg-primary/10 text-primary rounded-xl hover:bg-primary/15 transition-all shadow-sm group" 
          onClick={async () => { const c = await createNote.mutateAsync({ title: "Untitled note" }); router.push(`/notes/${c.id}`); }}
        >
          <Plus className="mr-2 size-4 group-hover:scale-110 transition-transform" weight="bold" /> 
          New Document
        </Button>
      </section>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
          <Input placeholder="Engineering Designs..." value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createFolder.mutate(folderName)} />
          <DialogFooter><Button onClick={() => { createFolder.mutate(folderName); setIsFolderDialogOpen(false); }}>Initialize Container</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <GlobalAssistantModal isOpen={globalAssistantOpen} onOpenChange={setGlobalAssistantOpen} />

    </aside>
  );
}
