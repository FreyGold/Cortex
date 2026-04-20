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
  deleteNote,
  getArchivedNotes,
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

export function useNotesDashboard() {
  return useQuery({
    queryKey: ["notes-dashboard"],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return getDashboardNotes(accessToken);
    },
  });
}

export function useArchivedNotes() {
  return useQuery({
    queryKey: ["archived-notes"],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return getArchivedNotes(accessToken);
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; folderId?: string | null }) => {
      const accessToken = await getAccessToken();
      return createNote(accessToken, input.title, input.folderId ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const accessToken = await getAccessToken();
      await createFolder(accessToken, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
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

export function usePublicNote(noteId: string, shareToken?: string) {
  return useQuery({
    queryKey: ["public-note", noteId, shareToken],
    queryFn: () => getPublicNoteDetail(noteId, shareToken),
    enabled: !!noteId,
  });
}
