"use client";

import {
  Archive,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Folder,
  Globe,
  MoreVertical,
  SquarePen as NotePencil,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArchivedItems,
  useArchiveNote,
  useCreateFolder,
  useCreateNote,
  useDeleteFolder,
  useMoveFolder,
  useMoveNote,
  useNotesDashboard,
  useUpdateFolder,
  useUpdateNote,
} from "@/hooks/use-notes";
import { useCurrentProfile } from "@/hooks/use-profile";
import {
  useCreateWorkspace,
  useJoinedWorkspaces,
  useWorkspaces,
} from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { GlobalAssistantModal } from "./global-assistant-modal";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentWorkspaceId = searchParams.get("workspaceId");
  const archiveNote = useArchiveNote();
  const updateNote = useUpdateNote(note.id);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(note.title || "");
  const isIntro = note.title === "Introduction";

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== note.title) {
      updateNote.mutate({ title: renameValue.trim() });
    } else {
      setRenameValue(note.title || "");
    }
    setIsRenaming(false);
  };

  const handleArchive = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    archiveNote.mutate(note.id);
    if (active) {
      router.push(
        `/notes${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
      );
    }
  };
  return (
    <ContextMenu onOpenChange={setIsMenuOpen}>
      <ContextMenuTrigger asChild>
        <Link
          href={`/notes/${note.id}${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`}
          className={cn(
            "group flex items-center gap-2.5 py-1.5 px-3 rounded-lg cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] select-none",
            active
              ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
              : "hover:bg-accent/40 text-muted-foreground/70 hover:text-foreground",
            isMenuOpen && "bg-accent/60 ring-1 ring-primary/10",
            note.is_optimistic &&
              "opacity-50 animate-pulse pointer-events-none",
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          draggable={!isRenaming}
          onDragStart={onDragStart}
          onClick={(e) => {
            if (isRenaming) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <FileText
            className={cn(
              "size-3.5 shrink-0",
              active ? "text-primary/70" : "opacity-30 group-hover:opacity-60",
            )}
          />

          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setRenameValue(note.title || "");
                  setIsRenaming(false);
                }
              }}
              className="flex-1 min-w-0 bg-transparent text-[13px] font-medium leading-none outline-none border-b border-primary/50"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                "truncate flex-1 text-[13px] font-medium leading-none",
                active && "font-semibold text-foreground",
              )}
            >
              {note.title || "Untitled"}
            </span>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {note.is_published && (
              <Globe className="size-3 text-emerald-500/40" />
            )}
            {!isIntro && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-0.5 hover:bg-muted-foreground/10 rounded transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <MoreVertical className="size-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRenaming(true);
                    }}
                  >
                    <FileText className="size-3" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateNote.mutate({ isPinned: !note.is_pinned });
                    }}
                  >
                    <Star className="size-3" />{" "}
                    {note.is_pinned ? "Unpin Note" : "Pin Note"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={handleArchive}
                  >
                    <Archive className="size-3" /> Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {!isIntro && (
          <>
            <ContextMenuItem onClick={() => setIsRenaming(true)}>
              <FileText className="size-4" />
              Rename Note
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => updateNote.mutate({ isPinned: !note.is_pinned })}
            >
              <Star className="size-4" />
              {note.is_pinned ? "Unpin Note" : "Pin Note"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => handleArchive()}
              variant="destructive"
            >
              <Archive className="size-4" />
              Archive Note
            </ContextMenuItem>
          </>
        )}
        {isIntro && (
          <ContextMenuItem disabled className="text-muted-foreground italic">
            System Note
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
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

function FolderNode({
  folder,
  allFolders,
  notes,
  depth,
  activeNoteId,
  onDrop,
  onCreateNote,
}: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const deleteFolder = useDeleteFolder();
  const updateFolder = useUpdateFolder();
  const createFolder = useCreateFolder();
  const searchParams = useSearchParams();
  const currentWorkspaceId = searchParams.get("workspaceId") || undefined;

  const childFolders = useMemo(
    () => allFolders.filter((f) => f.parent_id === folder.id),
    [allFolders, folder.id],
  );
  const folderNotes = useMemo(
    () => notes.filter((n) => n.folder_id === folder.id),
    [notes, folder.id],
  );

  useEffect(() => {
    if (activeNoteId && folderNotes.some((n) => n.id === activeNoteId))
      setExpanded(true);
  }, [activeNoteId, folderNotes]);

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== folder.name) {
      updateFolder.mutate({ folderId: folder.id, name: renameValue.trim() });
    } else {
      setRenameValue(folder.name);
    }
    setIsRenaming(false);
  };

  return (
    <div
      className="space-y-0.5"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOver(false);
        const type = e.dataTransfer.getData("type");
        const id = e.dataTransfer.getData("id");
        if (type && id) onDrop(type, id, folder.id);
      }}
    >
      <ContextMenu onOpenChange={setIsMenuOpen}>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "group flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] select-none",
              isOver
                ? "bg-primary/5 ring-1 ring-primary/20"
                : "hover:bg-accent/30 text-muted-foreground/70 hover:text-foreground",
              isMenuOpen && "bg-accent/40 ring-1 ring-primary/10",
              folder.is_optimistic &&
                "opacity-50 animate-pulse pointer-events-none",
            )}
            style={{ paddingLeft: `${depth * 12 + 4}px` }}
            draggable={!isRenaming}
            onDragStart={(e) => {
              if (isRenaming) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.setData("type", "folder");
              e.dataTransfer.setData("id", folder.id);
            }}
            onClick={() => !isRenaming && setExpanded(!expanded)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-0.5 rounded hover:bg-muted-foreground/10 transition-transform"
            >
              <ChevronRight
                className={cn(
                  "size-3.5 transition-transform",
                  expanded && "rotate-90",
                  childFolders.length === 0 &&
                    folderNotes.length === 0 &&
                    "opacity-20",
                )}
              />
            </button>
            <Folder
              className={cn(
                "size-3.5 shrink-0",
                isOver ? "text-primary" : "opacity-30 group-hover:opacity-60",
              )}
            />

            {isRenaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit();
                  if (e.key === "Escape") {
                    setRenameValue(folder.name);
                    setIsRenaming(false);
                  }
                }}
                className="flex-1 min-w-0 bg-transparent text-[13px] font-semibold tracking-tight outline-none border-b border-primary/50"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1 text-[13px] font-semibold tracking-tight">
                {folder.name}
              </span>
            )}

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateNote(folder.id);
                  setExpanded(true);
                }}
                className="p-0.5 hover:bg-muted-foreground/10 rounded"
              >
                <Plus className="size-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteAlert(true);
                }}
                className="p-0.5 hover:bg-destructive/10 text-destructive/70 hover:text-destructive rounded"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onClick={() => {
              setIsRenaming(true);
              setExpanded(true);
            }}
          >
            <Folder className="size-4" />
            Rename Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              onCreateNote(folder.id);
              setExpanded(true);
            }}
          >
            <FileText className="size-4" />
            New Note Inside
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              createFolder.mutate({
                name: "New Folder",
                workspaceId: currentWorkspaceId,
                parentId: folder.id,
              });
              setExpanded(true);
            }}
          >
            <Folder className="size-4" />
            New Folder Inside
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => setShowDeleteAlert(true)}
            variant="destructive"
          >
            <Archive className="size-4" />
            Archive Folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive the folder "{folder.name}"? All
              nested folders and notes will also be archived. You can restore
              them from the archive later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder.mutate(folder.id);
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {expanded && (
        <div className="space-y-0.5 relative">
          {childFolders.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              notes={notes}
              depth={depth + 1}
              activeNoteId={activeNoteId}
              onDrop={onDrop}
              onCreateNote={onCreateNote}
            />
          ))}
          {folderNotes.map((note) => (
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

  const currentWorkspaceId = searchParams.get("workspaceId") || undefined;
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [globalAssistantOpen, setGlobalAssistantOpen] = useState(false);
  const [isRootOver, setIsRootOver] = useState(false);

  const { data: profileData } = useCurrentProfile();
  const { data: joinedWorkspaces } = useJoinedWorkspaces();
  const { data: ownedWorkspaces } = useWorkspaces();

  const dashboardQuery = useNotesDashboard(currentWorkspaceId);
  const archivedQuery = useArchivedItems();
  const createNote = useCreateNote();
  const createFolder = useCreateFolder();
  const moveNote = useMoveNote();
  const moveFolder = useMoveFolder();

  // Helper to update URL with new search params
  const updateUrl = (updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });
    const newUrl = `${pathname}?${p.toString()}`;
    if (newUrl !== `${pathname}?${searchParams.toString()}`) {
      router.replace(newUrl);
    }
  };

  // DEBOUNCED SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl({ q: searchQuery });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDrop = async (
    type: string,
    id: string,
    targetId: string | null,
  ) => {
    if (type === "note")
      await moveNote.mutateAsync({ noteId: id, folderId: targetId });
    else if (type === "folder" && id !== targetId)
      await moveFolder.mutateAsync({ folderId: id, parentId: targetId });
  };

  const notes = dashboardQuery.data?.notes ?? [];
  const sharedNotes = dashboardQuery.data?.sharedNotes ?? [];
  const folders = dashboardQuery.data?.folders ?? [];
  const rootFolders = folders.filter((f) => !f.parent_id);
  const rootNotes = notes.filter((n) => !n.folder_id);
  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const publicNotes = notes.filter((n) => n.is_published);
  const archivedNotes = archivedQuery.data?.notes ?? [];
  const archivedFolders = archivedQuery.data?.folders ?? [];

  const profile = profileData?.profile;
  const isNotesPage = pathname.startsWith("/notes");

  const navigateTo = (path: string) => {
    router.push(
      `${path}${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
    );
  };

  // Find active workspace name
  const activeWorkspaceName = useMemo(() => {
    if (!currentWorkspaceId) return "Home";
    const joined = joinedWorkspaces?.find(
      (w: any) => w.id === currentWorkspaceId,
    );
    if (joined) return joined.name;
    const owned = ownedWorkspaces?.find(
      (w: any) => w.id === currentWorkspaceId,
    );
    if (owned) return owned.name;
    return "Workspace";
  }, [currentWorkspaceId, joinedWorkspaces, ownedWorkspaces]);

  const NavButton = ({
    icon: Icon,
    label,
    onClick,
    className,
    active,
  }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "will-change-transform w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all group select-none overflow-hidden",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-muted-foreground/40 group-hover:text-muted-foreground",
        )}
      />
      <span className="truncate flex-1 text-left">{label}</span>
    </button>
  );

  return (
    <div className="w-full flex flex-col h-full bg-[#fbfbfa] dark:bg-[#121212] select-none border-r border-border/5 overflow-x-hidden">
      {/* HEADER: User Profile & Workspace */}
      <div className="px-3 pt-4 pb-2 group/header">
        <div className="flex items-center justify-between mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-accent/40 cursor-pointer transition-colors flex-1 min-w-0">
                <Avatar className="size-5 rounded-md border border-border/10">
                  <AvatarImage
                    src={
                      (currentWorkspaceId
                        ? joinedWorkspaces?.find(
                            (w: any) => w.id === currentWorkspaceId,
                          )?.avatar_url
                        : profile?.avatar_url) || undefined
                    }
                  />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {activeWorkspaceName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-bold truncate tracking-tight">
                  {activeWorkspaceName}
                </span>
                <ChevronDown className="size-3 text-muted-foreground/30 ml-auto" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl">
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={() => updateUrl({ workspaceId: undefined })}
              >
                <UserCircle className="size-4" /> My Workspace
              </DropdownMenuItem>

              {ownedWorkspaces && ownedWorkspaces.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    My Workspaces
                  </div>
                  {ownedWorkspaces.map((w: any) => (
                    <DropdownMenuItem
                      key={w.id}
                      className="text-xs gap-2"
                      onClick={() => updateUrl({ workspaceId: w.id })}
                    >
                      <Avatar className="size-4 rounded-sm">
                        <AvatarImage src={w.avatar_url || undefined} />
                        <AvatarFallback className="text-[8px]">
                          {w.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {w.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {joinedWorkspaces &&
                joinedWorkspaces.filter(
                  (jw: any) =>
                    !ownedWorkspaces?.find((ow: any) => ow.id === jw.id),
                ).length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                      Shared Workspaces
                    </div>
                    {joinedWorkspaces
                      .filter(
                        (jw: any) =>
                          !ownedWorkspaces?.find((ow: any) => ow.id === jw.id),
                      )
                      .map((w: any) => (
                        <DropdownMenuItem
                          key={w.id}
                          className="text-xs gap-2"
                          onClick={() => updateUrl({ workspaceId: w.id })}
                        >
                          <Avatar className="size-4 rounded-sm">
                            <AvatarImage src={w.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {w.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {w.name}
                        </DropdownMenuItem>
                      ))}
                  </>
                )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={() =>
                  router.push(
                    `/settings?tab=team${currentWorkspaceId ? `&workspaceId=${currentWorkspaceId}` : ""}`,
                  )
                }
              >
                <Users className="size-4" /> Manage Team
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={() =>
                  router.push(
                    `/settings${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
                  )
                }
              >
                <Settings className="size-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 text-destructive"
                onClick={() => (window.location.href = "/auth/logout/submit")}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={onToggle}
            className="p-1.5 text-muted-foreground/30 hover:text-foreground hover:bg-accent/40 rounded-md transition-all opacity-0 group-hover/header:opacity-100"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="space-y-0.5 mb-4">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
            Main
          </div>
          <NavButton
            icon={NotePencil}
            label="Notes"
            onClick={() => navigateTo("/notes")}
            active={pathname.startsWith("/notes")}
          />
          <NavButton
            icon={Database}
            label="Data Hub"
            onClick={() => navigateTo("/data")}
            active={pathname.startsWith("/data")}
          />
          <NavButton
            icon={CalendarDays}
            label="Daily Track"
            onClick={() => navigateTo("/daily")}
            active={pathname.startsWith("/daily")}
          />
          {profile?.role === "admin" && (
            <NavButton
              icon={ShieldCheck}
              label="Admin"
              onClick={() => navigateTo("/admin")}
              active={pathname.startsWith("/admin")}
            />
          )}
          <NavButton
            icon={Settings}
            label="Settings"
            onClick={() => navigateTo("/settings")}
            active={pathname.startsWith("/settings")}
          />
        </div>

        {/* Notes Quick Actions - only on notes pages */}
        {isNotesPage && (
          <div className="space-y-0.5 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
              Notes
            </div>
            <NavButton
              icon={Star}
              label="Favorites"
              onClick={() =>
                router.push(
                  `/notes/favorites${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
                )
              }
              active={pathname === "/notes/favorites"}
            />
            <NavButton
              icon={Search}
              label="Search"
              onClick={() =>
                router.push(
                  `/notes${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}${searchParams.get("q") ? `&q=${searchParams.get("q")}` : ""}` : searchParams.get("q") ? `?q=${searchParams.get("q")}` : ""}`,
                )
              }
              active={pathname === "/notes" && !!searchParams.get("q")}
            />
            <NavButton
              icon={Sparkles}
              label="Assistant"
              onClick={() => setGlobalAssistantOpen(true)}
            />
            <NavButton
              icon={Clock}
              label="Recent"
              onClick={() =>
                router.push(
                  `/notes${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
                )
              }
              active={pathname === "/notes" && !searchParams.get("q")}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-10 space-y-6">
        {/* === NOTES-SPECIFIC CONTENT === */}
        {isNotesPage && (
          <>
            {/* FAVORITES */}
            {pinnedNotes.filter((n) => n.title !== "Introduction").length >
              0 && (
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">
                  Favorites
                </span>
                {pinnedNotes
                  .filter((n) => n.title !== "Introduction")
                  .map((n) => (
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                  Workspace
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
                  <button
                    onClick={() =>
                      createFolder.mutate({
                        name: "New Folder",
                        workspaceId: currentWorkspaceId,
                      })
                    }
                    className="p-1 hover:bg-muted-foreground/10 rounded transition-colors text-muted-foreground/50 hover:text-foreground"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              <button
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all text-primary hover:bg-primary/10 select-none group"
                onClick={async () => {
                  const c = await createNote.mutateAsync({
                    title: "",
                    workspaceId: currentWorkspaceId,
                  });
                  router.push(
                    `/notes/${c.id}${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
                  );
                }}
              >
                <Plus className="size-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate flex-1 text-left font-semibold">
                  New Page
                </span>
              </button>

              {dashboardQuery.isLoading ? (
                <SidebarNavSkeleton />
              ) : (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div
                      className="space-y-0.5 min-h-[200px] pb-10"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsRootOver(true);
                      }}
                      onDragLeave={() => setIsRootOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsRootOver(false);
                        const t = e.dataTransfer.getData("type");
                        const id = e.dataTransfer.getData("id");
                        if (t && id) handleDrop(t, id, null);
                      }}
                    >
                      {rootFolders.map((f) => (
                        <FolderNode
                          key={f.id}
                          folder={f}
                          allFolders={folders}
                          notes={notes}
                          depth={0}
                          activeNoteId={activeNoteId}
                          onDrop={handleDrop}
                          onCreateNote={async (fid) => {
                            const c = await createNote.mutateAsync({
                              title: "Untitled note",
                              folderId: fid,
                              workspaceId: currentWorkspaceId,
                            });
                            router.push(
                              `/notes/${c.id}${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
                            );
                          }}
                        />
                      ))}
                      {rootNotes
                        .filter((n) => n.title !== "Introduction")
                        .map((n) => (
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
                  </ContextMenuTrigger>{" "}
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onClick={async () => {
                        const c = await createNote.mutateAsync({
                          title: "",
                          workspaceId: currentWorkspaceId,
                        });
                        router.push(
                          `/notes/${c.id}${currentWorkspaceId ? `?workspaceId=${currentWorkspaceId}` : ""}`,
                        );
                      }}
                    >
                      <FileText className="size-4" />
                      New Note
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        createFolder.mutate({
                          name: "New Folder",
                          workspaceId: currentWorkspaceId,
                        })
                      }
                    >
                      <Folder className="size-4" />
                      New Folder
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )}
            </div>

            {/* SHARED SECTION */}
            {sharedNotes.length > 0 && (
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">
                  Shared with me
                </span>
                {sharedNotes.map((n) => (
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
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 mb-2 block">
                  Public
                </span>
                {publicNotes.map((n) => (
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
          </>
        )}
      </div>
      <GlobalAssistantModal
        isOpen={globalAssistantOpen}
        onOpenChange={setGlobalAssistantOpen}
      />
    </div>
  );
}
