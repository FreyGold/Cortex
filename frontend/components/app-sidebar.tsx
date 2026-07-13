"use client";

import {
  Archive,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  History,
  LayoutDashboard,
  MoreVertical,
  SquarePen as NotePencil,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCircle,
  Users,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
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
import { useJoinedWorkspaces, useWorkspaces } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { GlobalAssistantModal } from "@/components/notes/global-assistant-modal";

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

// --- NOTE ITEM COMPONENT ---
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
              ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 font-semibold"
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

// --- FOLDER NODE COMPONENT ---
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

// --- MAIN UNIFIED APP SIDEBAR ---
interface AppSidebarProps {
  onToggle?: () => void;
  activeDailyTab?: string;
  onDailyTabChange?: (tab: string) => void;
  isOpen?: boolean;
}

export function AppSidebar({
  onToggle,
  activeDailyTab,
  onDailyTabChange,
  isOpen = true,
}: AppSidebarProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentWorkspaceId = searchParams.get("workspaceId") || undefined;
  const activeNoteId = params.id as string | undefined;
  const currentTab = searchParams.get("tab") || "profile";

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

  const profile = profileData?.profile;

  const isNotesPage = pathname.startsWith("/notes");
  const isDailyPage = pathname.startsWith("/daily");
  const isSettingsPage = pathname.startsWith("/settings");

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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isNotesPage) {
        updateUrl({ q: searchQuery || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isNotesPage]);

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

  const navigateTo = (path: string, tab?: string) => {
    const workspaceId = searchParams.get("workspaceId");
    let url = path;
    const params = new URLSearchParams();
    if (workspaceId) params.set("workspaceId", workspaceId);
    if (tab) params.set("tab", tab);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    router.push(url);
  };

  const NavButton = ({
    icon: Icon,
    label,
    onClick,
    active,
    variant = "default",
    className,
  }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all group select-none overflow-hidden",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : variant === "ghost"
            ? "text-muted-foreground/50 hover:text-foreground hover:bg-accent/40"
            : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground/40 group-hover:text-muted-foreground",
        )}
      />
      <span className="truncate flex-1 text-left">{label}</span>
    </button>
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar select-none border-r border-border/5 overflow-x-hidden transition-all duration-300",
        isOpen ? "w-[260px] opacity-100" : "w-0 opacity-0 pointer-events-none",
      )}
    >
      {/* HEADER: User Profile & Workspace Dropdown */}
      <div className="px-3 pt-6 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-accent/40 cursor-pointer transition-colors flex-1 min-w-0 border border-transparent hover:border-border/10">
              <Avatar className="size-6 rounded-lg border border-border/10">
                <AvatarImage
                  src={
                    (currentWorkspaceId
                      ? joinedWorkspaces?.find(
                          (w: any) => w.id === currentWorkspaceId,
                        )?.avatar_url
                      : profile?.avatar_url) || undefined
                  }
                />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                  {activeWorkspaceName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-bold truncate tracking-tight">
                {activeWorkspaceName}
              </span>
              <ChevronDown className="size-3 text-muted-foreground/30 ml-auto" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-56 rounded-2xl p-2 shadow-2xl border-border/10"
          >
            <DropdownMenuItem
              className="rounded-xl gap-2 text-xs py-2"
              onClick={() => updateUrl({ workspaceId: undefined })}
            >
              <UserCircle className="size-4" /> My Workspace
            </DropdownMenuItem>

            {joinedWorkspaces && joinedWorkspaces.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-border/5" />
                <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/30">
                  Shared Workspaces
                </div>
                {joinedWorkspaces.map((w: any) => (
                  <DropdownMenuItem
                    key={w.id}
                    className="rounded-xl gap-2 text-xs py-2"
                    onClick={() => updateUrl({ workspaceId: w.id })}
                  >
                    <Avatar className="size-4 rounded-md">
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

            <DropdownMenuSeparator className="bg-border/5" />
            <DropdownMenuItem
              className="rounded-xl gap-2 text-xs py-2"
              onClick={() => navigateTo("/settings", "team")}
            >
              <Users className="size-4" /> Manage Team
            </DropdownMenuItem>
            <DropdownMenuItem
              className="rounded-xl gap-2 text-xs py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={() => (window.location.href = "/auth/logout/submit")}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Global Navigation */}
      <div className="px-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
          University Hub
        </div>
        <NavButton
          icon={NotePencil}
          label="Notes & Docs"
          onClick={() => navigateTo("/notes")}
          active={pathname.startsWith("/notes")}
        />
        <NavButton
          icon={Database}
          label="Resources"
          onClick={() => navigateTo("/data")}
          active={pathname.startsWith("/data")}
        />
        <NavButton
          icon={CalendarDays}
          label="Daily Track"
          onClick={() => navigateTo("/daily")}
          active={pathname.startsWith("/daily")}
        />
        <NavButton
          icon={Settings}
          label="Settings"
          onClick={() => navigateTo("/settings")}
          active={pathname.startsWith("/settings")}
        />
        {profile?.role === "admin" && (
          <NavButton
            icon={ShieldCheck}
            label="Admin Panel"
            onClick={() => navigateTo("/admin")}
            active={pathname.startsWith("/admin")}
          />
        )}
      </div>

      {/* Divider */}
      <div className="mx-6 my-4 border-t border-border/5" />

      {/* Contextual Subsections */}
      <div className="flex-1 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {/* --- NOTES CONTEXT --- */}
        {isNotesPage && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Quick Actions */}
            <div className="space-y-1">
              <NavButton
                icon={Search}
                label="Search"
                onClick={() => navigateTo("/notes")}
                active={pathname === "/notes" && !!searchParams.get("q")}
                variant="ghost"
              />
              <NavButton
                icon={Sparkles}
                label="Assistant"
                onClick={() => setGlobalAssistantOpen(true)}
                variant="ghost"
              />
            </div>

            {/* Favorites List */}
            {pinnedNotes.filter((n) => n.title !== "Introduction").length >
              0 && (
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 block mb-1">
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

            {/* Folder Tree & Pages */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 mb-1 group/section">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
                  Workspace Pages
                </span>
                <button
                  onClick={() =>
                    createFolder.mutate({
                      name: "New Folder",
                      workspaceId: currentWorkspaceId,
                    })
                  }
                  className="p-1 opacity-0 group-hover/section:opacity-100 hover:bg-muted-foreground/10 rounded transition-all text-muted-foreground/50 hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                </button>
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
                      className="space-y-0.5 min-h-[150px] pb-10"
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
                  </ContextMenuTrigger>
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

            {/* Shared with me */}
            {sharedNotes.length > 0 && (
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 block mb-1">
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

            {/* Public */}
            {publicNotes.length > 0 && (
              <div className="space-y-1">
                <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 block mb-1">
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
          </div>
        )}

        {/* --- DAILY CONTEXT --- */}
        {isDailyPage && (
          <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
              Daily Track
            </div>
            <NavButton
              icon={CalendarDays}
              label="Calendar"
              onClick={() => onDailyTabChange?.("calendar")}
              active={activeDailyTab === "calendar"}
            />
            <NavButton
              icon={Sparkles}
              label="Daily Assistant"
              onClick={() => onDailyTabChange?.("assistant")}
              active={activeDailyTab === "assistant"}
            />
          </div>
        )}

        {/* --- SETTINGS CONTEXT --- */}
        {isSettingsPage && (
          <div className="space-y-1 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">
              Configuration
            </div>
            <NavButton
              icon={UserCircle}
              label="Profile Settings"
              onClick={() => navigateTo("/settings", "profile")}
              active={currentTab === "profile"}
            />
            <NavButton
              icon={Users}
              label="Workspace & Team"
              onClick={() => navigateTo("/settings", "team")}
              active={currentTab === "team"}
            />
            <NavButton
              icon={Wand2}
              label="AI Integration"
              onClick={() => navigateTo("/settings", "ai")}
              active={currentTab === "ai"}
            />
            <NavButton
              icon={GraduationCap}
              label="Academic Path"
              onClick={() => navigateTo("/settings", "academic")}
              active={currentTab === "academic"}
            />
            <NavButton
              icon={Settings2}
              label="Preferences"
              onClick={() => navigateTo("/settings", "preferences")}
              active={currentTab === "preferences"}
            />
          </div>
        )}
      </div>

      {/* FOOTER: Hide Sidebar button */}
      <div className="p-4 border-t border-border/5">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-tighter text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <PanelLeftClose className="size-3" /> Hide Sidebar
        </button>
      </div>

      <GlobalAssistantModal
        isOpen={globalAssistantOpen}
        onOpenChange={setGlobalAssistantOpen}
      />
    </div>
  );
}
