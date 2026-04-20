"use client";

import {
  Folder,
  Plus,
  FileText,
  Tag,
  ChevronRight,
  Search,
  Sparkles,
  Trash2,
  Clock,
  MoreVertical,
  Globe,
  Users,
  Archive,
  Star,
  Settings,
  UserCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCreateFolder,
  useCreateNote,
  useMoveFolder,
  useMoveNote,
  useNotesDashboard,
  useArchivedNotes,
  useArchiveNote,
} from "@/hooks/use-notes";
import { cn } from "@/lib/utils";
import { GlobalAssistantModal } from "./global-assistant-modal";

// --- SKELETON ---

function SidebarNavSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-[90%] rounded-md" />
        <Skeleton className="h-7 w-full rounded-md" />
      </div>
    </div>
  );
}

// --- ITEM COMPONENTS ---

interface NoteItemProps {
  note: any;
  active: boolean;
  depth: number;
  onDragStart: (e: React.DragEvent) => void;
}

function NoteItem({ note, active, depth, onDragStart }: NoteItemProps) {
  const archiveNote = useArchiveNote();

  return (
    <Link 
      href={`/notes/${note.id}`} 
      className={cn(
        "group flex items-center gap-2 py-1 px-2 rounded-md transition-all relative select-none",
        active ? "bg-accent/80 text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
      )}
      style={{ paddingLeft: `${depth * 16 + 12}px` }}
      draggable
      onDragStart={onDragStart}
    >
      <FileText className={cn("size-3.5 shrink-0", active ? "text-primary" : "opacity-40")} />
      <span className={cn("truncate flex-1 text-sm font-medium", active && "font-semibold tracking-tight")}>
        {note.title || "Untitled"}
      </span>
      
      {note.is_published && <Globe className="size-3 text-emerald-500/60" />}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted-foreground/10 rounded transition-opacity" onClick={(e) => e.preventDefault()}>
            <MoreVertical className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl">
          <DropdownMenuItem className="text-xs gap-2" onClick={() => archiveNote.mutate(note.id)}>
            <Archive className="size-3" /> Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
}

interface FolderNodeProps {
  folder: any;
  allFolders: any[];
  notes: any[];
  depth: number;
  activeNoteId?: string;
  onDrop: (type: string, id: string, targetId: string | null) => void;
  onCreateNote: (fid: string) => void;
}

function FolderNode({ folder, allFolders, notes, depth, activeNoteId, onDrop, onCreateNote }: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOver, setIsOver] = useState(false);

  const childFolders = useMemo(() => allFolders.filter(f => f.parent_id === folder.id), [allFolders, folder.id]);
  const folderNotes = useMemo(() => notes.filter(n => n.folder_id === folder.id), [notes, folder.id]);

  useEffect(() => {
    if (activeNoteId && folderNotes.some(n => n.id === activeNoteId)) setExpanded(true);
  }, [activeNoteId, folderNotes]);

  return (
    <div 
      className="space-y-0.5"
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setIsOver(false);
        const type = e.dataTransfer.getData("type");
        const id = e.dataTransfer.getData("id");
        if (type && id) onDrop(type, id, folder.id);
      }}
    >
      <div 
        className={cn(
          "group flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer transition-all select-none",
          isOver ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-accent/40 text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("type", "folder");
          e.dataTransfer.setData("id", folder.id);
        }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="p-0.5 rounded hover:bg-muted-foreground/10 transition-transform"
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90", (childFolders.length === 0 && folderNotes.length === 0) && "opacity-20")} />
        </button>
        <Folder className={cn("size-3.5 shrink-0", isOver ? "text-primary" : "opacity-40")} />
        <span className="truncate flex-1 text-sm font-semibold tracking-tight" onClick={() => setExpanded(!expanded)}>
          {folder.name}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onCreateNote(folder.id); setExpanded(true); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted-foreground/10 rounded transition-opacity"
        >
          <Plus className="size-3" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-0.5 relative">
          {childFolders.map(child => (
            <FolderNode key={child.id} folder={child} allFolders={allFolders} notes={notes} depth={depth + 1} activeNoteId={activeNoteId} onDrop={onDrop} onCreateNote={onCreateNote} />
          ))}
          {folderNotes.map(note => (
            <NoteItem 
              key={note.id} 
              note={note} 
              active={activeNoteId === note.id} 
              depth={depth + 1} 
              onDragStart={(e) => {
                e.dataTransfer.setData("type", "note");
                e.dataTransfer.setData("id", note.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- MAIN SIDEBAR ---

export function NotesSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeNoteId = params.id as string | undefined;
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [globalAssistantOpen, setGlobalAssistantOpen] = useState(false);
  const [isRootOver, setIsRootOver] = useState(false);

  const dashboardQuery = useNotesDashboard();
  const archivedQuery = useArchivedNotes();
  const createNote = useCreateNote();
  const createFolder = useCreateFolder();
  const moveNote = useMoveNote();
  const moveFolder = useMoveFolder();

  // DEBOUNCED SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (searchQuery) p.set("q", searchQuery); else p.delete("q");
      router.replace(`${pathname}?${p.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDrop = async (type: string, id: string, targetId: string | null) => {
    if (type === "note") await moveNote.mutateAsync({ noteId: id, folderId: targetId });
    else if (type === "folder" && id !== targetId) await moveFolder.mutateAsync({ folderId: id, parentId: targetId });
  };

  const notes = dashboardQuery.data?.notes ?? [];
  const folders = dashboardQuery.data?.folders ?? [];
  const rootFolders = folders.filter(f => !f.parent_id);
  const rootNotes = notes.filter(n => !n.folder_id);

  return (
    <div className="flex flex-col h-full bg-[#fbfbfa] dark:bg-[#191919] select-none">
      {/* QUICK SEARCH & NAV */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar pt-2 pb-10">
        <div className="space-y-0.5">
           <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-8 text-xs font-medium gap-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground rounded-md px-2"
            onClick={() => setGlobalAssistantOpen(true)}
          >
            <Sparkles className="size-3.5 text-primary" /> Assistant
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs font-medium gap-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground rounded-md px-2">
            <Clock className="size-3.5" /> Recent
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs font-medium gap-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground rounded-md px-2">
            <Settings className="size-3.5" /> Settings
          </Button>
        </div>

        {/* WORKSPACE HIERARCHY */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-1 group/section">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Private Workspace</span>
            <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
              <button onClick={() => createFolder.mutate("New Folder")} className="p-1 hover:bg-muted-foreground/10 rounded"><Plus className="size-3" /></button>
            </div>
          </div>

          {dashboardQuery.isLoading ? <SidebarNavSkeleton /> : (
            <div 
              className="space-y-0.5 min-h-[40px]" 
              onDragOver={(e) => { e.preventDefault(); setIsRootOver(true); }} 
              onDragLeave={() => setIsRootOver(false)} 
              onDrop={(e) => { e.preventDefault(); setIsRootOver(false); const t = e.dataTransfer.getData("type"); const id = e.dataTransfer.getData("id"); if (t && id) handleDrop(t, id, null); }}
            >
              {rootFolders.map(f => (
                <FolderNode 
                  key={f.id} 
                  folder={f} 
                  allFolders={folders} 
                  notes={notes} 
                  depth={0} 
                  activeNoteId={activeNoteId} 
                  onDrop={handleDrop} 
                  onCreateNote={async (fid) => {
                    const c = await createNote.mutateAsync({ title: "Untitled note", folderId: fid });
                    router.push(`/notes/${c.id}`);
                  }} 
                />
              ))}
              {rootNotes.map(n => (
                <NoteItem 
                  key={n.id} 
                  note={n} 
                  active={activeNoteId === n.id} 
                  depth={0} 
                  onDragStart={(e) => {
                    e.dataTransfer.setData("type", "note");
                    e.dataTransfer.setData("id", n.id);
                  }} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-2 mt-auto border-t border-border/10 space-y-1 bg-muted/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-[11px] font-medium gap-2 text-muted-foreground/60 hover:bg-accent/40 rounded-md px-2">
              <Trash2 className="size-3.5" /> Trash
              {archivedQuery.data && archivedQuery.data.length > 0 && (
                <span className="ml-auto text-[9px] bg-muted-foreground/10 px-1.5 rounded-full">{archivedQuery.data.length}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" className="w-56 rounded-xl p-1" align="end">
             <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Deleted Notes</div>
             <DropdownMenuSeparator />
             <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {archivedQuery.data?.length ? archivedQuery.data.map(n => (
                  <DropdownMenuItem key={n.id} className="text-xs flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer">
                    <span className="font-medium truncate w-full">{n.title || "Untitled note"}</span>
                    <span className="text-[9px] opacity-40">{new Date(n.archived_at!).toLocaleDateString()}</span>
                  </DropdownMenuItem>
                )) : <div className="p-6 text-center text-[10px] text-muted-foreground/30 italic">Empty</div>}
             </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          className="w-full justify-start h-9 text-xs font-bold bg-primary text-primary-foreground rounded-lg shadow-sm hover:opacity-90 transition-all gap-2 px-3 mt-2" 
          onClick={async () => {
            const c = await createNote.mutateAsync({ title: "" });
            router.push(`/notes/${c.id}`);
          }}
        >
          <Plus className="size-4" /> New Page
        </Button>
      </div>

      <GlobalAssistantModal isOpen={globalAssistantOpen} onOpenChange={setGlobalAssistantOpen} />
    </div>
  );
}
