"use client";

import {
  Folder,
  Plus,
  FileText,
  ChevronRight,
  Search,
  Sparkles,
  Trash2,
  Clock,
  MoreVertical,
  Globe,
  Archive,
  Star,
  Settings,
  UserCircle,
  Database,
  ShieldCheck,
  PanelLeftClose,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
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
import { useCurrentProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { GlobalAssistantModal } from "./global-assistant-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- SKELETON ---

function SidebarNavSkeleton() {
  return (
    <div className="space-y-4 px-3">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-md opacity-20" />
        <Skeleton className="h-4 w-[90%] rounded-md opacity-20" />
        <Skeleton className="h-4 w-full rounded-md opacity-20" />
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
        "group flex items-center gap-2 py-1.5 px-3 rounded-md transition-all relative select-none",
        active ? "bg-accent/60 text-foreground" : "text-muted-foreground/70 hover:bg-accent/30 hover:text-foreground"
      )}
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
      draggable
      onDragStart={onDragStart}
    >
      <FileText className={cn("size-3.5 shrink-0", active ? "text-primary/70" : "opacity-30 group-hover:opacity-60")} />
      <span className={cn("truncate flex-1 text-[13px] font-medium leading-none", active && "font-semibold text-foreground")}>
        {note.title || "Untitled"}
      </span>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
         {note.is_published && <Globe className="size-3 text-emerald-500/40" />}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-0.5 hover:bg-muted-foreground/10 rounded transition-colors" onClick={(e) => e.preventDefault()}>
                    <MoreVertical className="size-3" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
                <DropdownMenuItem className="text-xs gap-2" onClick={() => archiveNote.mutate(note.id)}>
                    <Archive className="size-3" /> Archive
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
          "group flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-all select-none",
          isOver ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-accent/30 text-muted-foreground/70 hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("type", "folder");
          e.dataTransfer.setData("id", folder.id);
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="p-0.5 rounded hover:bg-muted-foreground/10 transition-transform"
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90", (childFolders.length === 0 && folderNotes.length === 0) && "opacity-20")} />
        </button>
        <Folder className={cn("size-3.5 shrink-0", isOver ? "text-primary" : "opacity-30 group-hover:opacity-60")} />
        <span className="truncate flex-1 text-[13px] font-semibold tracking-tight">
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

interface NotesSidebarProps {
  onToggle?: () => void;
}

export function NotesSidebar({ onToggle }: NotesSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const activeNoteId = params.id as string | undefined;
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [globalAssistantOpen, setGlobalAssistantOpen] = useState(false);
  const [isRootOver, setIsRootOver] = useState(false);

  const { data: profileData } = useCurrentProfile();
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
  const sharedNotes = dashboardQuery.data?.sharedNotes ?? [];
  const folders = dashboardQuery.data?.folders ?? [];
  const rootFolders = folders.filter(f => !f.parent_id);
  const rootNotes = notes.filter(n => !n.folder_id);
  const pinnedNotes = notes.filter(n => n.is_pinned);
  const publicNotes = notes.filter(n => n.is_published);
  const archivedNotes = archivedQuery.data ?? [];

  const profile = profileData?.profile;

  const NavButton = ({ icon: Icon, label, onClick, className, active }: any) => (
    <button 
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all group select-none",
            active ? "bg-accent text-foreground" : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground",
            className
        )}
    >
        <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground")} />
        <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="w-full flex flex-col h-full bg-[#fbfbfa] dark:bg-[#121212] select-none border-r border-border/5">
      {/* HEADER: User Profile & Workspace */}
      <div className="px-3 pt-4 pb-2 group/header">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-accent/40 cursor-pointer transition-colors flex-1 min-w-0">
                <Avatar className="size-5 rounded-md border border-border/10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{profile?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-bold truncate tracking-tight">{profile?.name || "Workspace"}</span>
                <ChevronDown className="size-3 text-muted-foreground/30 ml-auto" />
            </div>
            <button 
                onClick={onToggle}
                className="p-1.5 text-muted-foreground/30 hover:text-foreground hover:bg-accent/40 rounded-md transition-all opacity-0 group-hover/header:opacity-100"
            >
                <PanelLeftClose className="size-4" />
            </button>
        </div>

        {/* Global Action Shortcuts */}
        <div className="space-y-0.5 mb-6">
            <NavButton icon={Search} label="Search" onClick={() => router.push("/notes")} active={pathname === "/notes" && !!searchParams.get("q")} />
            <NavButton icon={Sparkles} label="Assistant" onClick={() => setGlobalAssistantOpen(true)} />
            <NavButton icon={Settings} label="Settings" onClick={() => router.push("/settings")} active={pathname === "/settings"} />
            <NavButton icon={Clock} label="Recent" onClick={() => router.push("/notes")} active={pathname === "/notes" && !searchParams.get("q")} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-10 space-y-6">
        {/* FAVORITES */}
        {pinnedNotes.length > 0 && (
            <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">Favorites</span>
                {pinnedNotes.map(n => (
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

        {/* WORKSPACE HIERARCHY */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2 group/section">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Workspace</span>
            <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
              <button onClick={() => createFolder.mutate("New Folder")} className="p-1 hover:bg-muted-foreground/10 rounded transition-colors text-muted-foreground/50 hover:text-foreground">
                <Plus className="size-3.5" />
              </button>
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

        {/* SHARED SECTION */}
        {sharedNotes.length > 0 && (
            <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">Shared with me</span>
                {sharedNotes.map(n => (
                    <NoteItem 
                        key={n.id} 
                        note={n} 
                        active={activeNoteId === n.id} 
                        depth={0} 
                        onDragStart={() => {}} 
                    />
                ))}
            </div>
        )}

        {/* PUBLIC SECTION */}
        {publicNotes.length > 0 && (
            <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">Public</span>
                {publicNotes.map(n => (
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

        {/* ARCHIVE SECTION */}
        {archivedNotes.length > 0 && (
            <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">Archive</span>
                {archivedNotes.map(n => (
                    <div key={n.id} className="flex items-center gap-2 px-3 py-1 text-muted-foreground/40 text-[12px] italic">
                        <Archive className="size-3" />
                        <span className="truncate">{n.title || "Untitled"}</span>
                    </div>
                ))}
            </div>
        )}

        {/* SYSTEM & GLOBAL NAV */}
        <div className="space-y-1 mt-auto pt-4 border-t border-border/5">
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">Cortex</span>
            <NavButton icon={Database} label="Data Browser" onClick={() => router.push("/data")} active={pathname === "/data" || pathname.startsWith("/data/")} />
            {profile?.role === "admin" && (
                <NavButton icon={ShieldCheck} label="Admin Panel" onClick={() => router.push("/admin")} active={pathname === "/admin"} />
            )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-3 mt-auto">
        <button 
          className="w-full flex items-center justify-center h-10 text-[13px] font-bold bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2" 
          onClick={async () => {
            const c = await createNote.mutateAsync({ title: "" });
            router.push(`/notes/${c.id}`);
          }}
        >
          <Plus className="size-4 stroke-[3]" /> New Page
        </button>
      </div>

      <GlobalAssistantModal isOpen={globalAssistantOpen} onOpenChange={setGlobalAssistantOpen} />
    </div>
  );
}
