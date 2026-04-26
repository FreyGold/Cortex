"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  getDashboardNotes,
  createNote,
  createFolder,
  createTag,
  getNoteDetail,
  updateNote,
  updateNoteTags,
  getNoteShares,
  createNoteShare,
  deleteNoteShare,
  updateFolder,
  deleteFolder,
  deleteNote,
  restoreNote,
  deleteNoteForever,
  getArchivedItems,
  restoreFolder,
  deleteFolderForever,
  getPublicNoteDetail,
  replicateNote,
  createCourseResource,
  type NoteListItem,
  type FolderItem,
  type TagItem,
  type NoteTagLink,
  type NoteShareItem,
} from "@/lib/api/notes";

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to access notes.");
  }

  return session.access_token;
}

export function useNotesDashboard(workspaceId?: string) {
  return useQuery({
    queryKey: ["notes-dashboard", workspaceId],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return getDashboardNotes(accessToken, workspaceId);
    },
  });
}

export function useArchivedItems() {
  return useQuery({
    queryKey: ["archived-items"],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return getArchivedItems(accessToken);
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; folderId?: string | null; workspaceId?: string }) => {
      const accessToken = await getAccessToken();
      return createNote(accessToken, input.title, input.folderId ?? null, input.workspaceId);
    },
    onMutate: async (newNote) => {
      const workspaceId = newNote.workspaceId || undefined;
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard", workspaceId] });
      const previousDashboard = queryClient.getQueryData(["notes-dashboard", workspaceId]);

      if (previousDashboard) {
        queryClient.setQueryData(["notes-dashboard", workspaceId], (old: any) => {
          if (!old) return old;
          const tempNote = {
            id: `temp-${Math.random()}`,
            title: newNote.title || "Untitled note",
            folder_id: newNote.folderId || null,
            workspace_id: newNote.workspaceId || null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            is_optimistic: true,
            note_tags: [],
          };
          return {
            ...old,
            notes: [tempNote, ...(old.notes || [])],
          };
        });
      }

      return { previousDashboard, workspaceId };
    },
    onError: (err, newNote, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(["notes-dashboard", context.workspaceId], context.previousDashboard);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard", variables.workspaceId || undefined] });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; workspaceId?: string; parentId?: string | null } | string) => {
      const name = typeof input === "string" ? input : input.name;
      const workspaceId = typeof input === "string" ? undefined : input.workspaceId;
      const parentId = typeof input === "string" ? undefined : input.parentId;
      const accessToken = await getAccessToken();
      await createFolder(accessToken, name, workspaceId, parentId);
    },
    onMutate: async (input) => {
      const name = typeof input === "string" ? input : input.name;
      const workspaceId = typeof input === "string" ? undefined : input.workspaceId;
      const parentId = typeof input === "string" ? undefined : input.parentId;

      await queryClient.cancelQueries({ queryKey: ["notes-dashboard", workspaceId] });
      const previousDashboard = queryClient.getQueryData(["notes-dashboard", workspaceId]);

      if (previousDashboard) {
        queryClient.setQueryData(["notes-dashboard", workspaceId], (old: any) => {
          if (!old) return old;
          const tempFolder = {
            id: `temp-${Math.random()}`,
            name: name,
            parent_id: parentId || null,
            workspace_id: workspaceId || null,
            is_optimistic: true,
            color: null,
          };
          return {
            ...old,
            folders: [tempFolder, ...(old.folders || [])],
          };
        });
      }

      return { previousDashboard, workspaceId };
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(["notes-dashboard", context.workspaceId], context.previousDashboard);
      }
    },
    onSettled: (_, __, input) => {
      const workspaceId = typeof input === "string" ? undefined : input.workspaceId;
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard", workspaceId] });
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const accessToken = await getAccessToken();
      await createTag(accessToken, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["note-detail"] });
    },
  });
}

export function useNoteDetail(noteId: string) {
  return useQuery({
    queryKey: ["note-detail", noteId],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return getNoteDetail(accessToken, noteId);
    },
  });
}

export function useUpdateNote(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      title?: string;
      html?: string;
      content?: any;
      contentText?: string;
      folderId?: string | null;
      isPublished?: boolean;
      isPinned?: boolean;
    }) => {
      const accessToken = await getAccessToken();
      await updateNote(accessToken, noteId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-detail", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
    },
  });
}

export function useArchiveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const accessToken = await getAccessToken();
      await deleteNote(accessToken, noteId);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["note-detail", noteId] });
      queryClient.invalidateQueries({ queryKey: ["archived-notes"] });
    },
  });
}

export function useRestoreNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const accessToken = await getAccessToken();
      await restoreNote(accessToken, noteId);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["note-detail", noteId] });
      queryClient.invalidateQueries({ queryKey: ["archived-notes"] });
    },
  });
}

export function useDeleteNoteForever() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const accessToken = await getAccessToken();
      await deleteNoteForever(accessToken, noteId);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ["archived-notes"] });
    },
  });
}

export function useUpdateNoteTags(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagIds: string[]) => {
      const accessToken = await getAccessToken();
      await updateNoteTags(accessToken, noteId, tagIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-detail", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
    },
  });
}

export function useNoteShares(noteId: string) {
  return useQuery({
    queryKey: ["note-shares", noteId],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return getNoteShares(accessToken, noteId);
    },
  });
}

export function useCreateNoteShare(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      mode: "user" | "link";
      sharedWithUserId?: string;
      canEdit?: boolean;
      role?: "viewer" | "editor";
      expiresAt?: string | null;
    }) => {
      const accessToken = await getAccessToken();
      return createNoteShare(accessToken, noteId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-shares", noteId] });
    },
  });
}

export function useDeleteNoteShare(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shareId: string) => {
      const accessToken = await getAccessToken();
      await deleteNoteShare(accessToken, noteId, shareId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-shares", noteId] });
    },
  });
}

export function useMoveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      noteId,
      folderId,
    }: {
      noteId: string;
      folderId: string | null;
    }) => {
      const accessToken = await getAccessToken();
      await updateNote(accessToken, noteId, { folderId });
    },
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["note-detail", noteId] });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      folderId,
      name,
    }: {
      folderId: string;
      name: string;
    }) => {
      const accessToken = await getAccessToken();
      await updateFolder(accessToken, folderId, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
    },
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      folderId,
      parentId,
    }: {
      folderId: string;
      parentId: string | null;
    }) => {
      const accessToken = await getAccessToken();
      await updateFolder(accessToken, folderId, { parentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: string) => {
      const accessToken = await getAccessToken();
      await deleteFolder(accessToken, folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["note-detail"] });
    },
  });
}

export function useReplicateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; content: any; contentText: string }) => {
      const accessToken = await getAccessToken();
      return replicateNote(accessToken, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
    },
  });
}

export function useCreateCourseResource(noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { courseId: string; titleEn: string }) => {
      const accessToken = await getAccessToken();
      return createCourseResource(accessToken, noteId, payload);
    },
    onSuccess: () => {
    },
  });
}

export function usePublicNote(noteId: string) {
  return useQuery({
    queryKey: ["public-note", noteId],
    queryFn: () => getPublicNoteDetail(noteId),
    enabled: !!noteId,
  });
}

export function useRestoreFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: string) => {
      const accessToken = await getAccessToken();
      await restoreFolder(accessToken, folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
    },
  });
}

export function useDeleteFolderForever() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: string) => {
      const accessToken = await getAccessToken();
      await deleteFolderForever(accessToken, folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
    },
  });
}
