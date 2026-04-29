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
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

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

      // Correct way to update multiple specific queries in v5
      queryClient.getQueryCache().findAll({ queryKey: ["notes-dashboard"] }).forEach(query => {
        const queryWorkspaceId = query.queryKey[1];
        if (workspaceId === (queryWorkspaceId || undefined)) {
          queryClient.setQueryData(query.queryKey, (old: any) => {
            if (!old) return old;
            return {
              ...old,
              notes: [tempNote, ...(old.notes || [])],
            };
          });
        }
      });

      return { previousDashboards };
    },
    onSuccess: (data) => {
      // Correct way to update multiple specific queries in v5
      queryClient.getQueryCache().findAll({ queryKey: ["notes-dashboard"] }).forEach(query => {
        const queryWorkspaceId = query.queryKey[1];
        if (data.workspace_id === (queryWorkspaceId || null)) {
          queryClient.setQueryData(query.queryKey, (old: any) => {
            if (!old) return old;
            const filteredNotes = old.notes?.filter((n: any) => !n.is_optimistic && n.id !== data.id) || [];
            return {
              ...old,
              notes: [{ ...data, note_tags: [] }, ...filteredNotes],
            };
          });
        }
      });
    },
    onError: (err, newNote, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
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
      return createFolder(accessToken, name, workspaceId, parentId);
    },
    onMutate: async (input) => {
      const name = typeof input === "string" ? input : input.name;
      const workspaceId = typeof input === "string" ? undefined : input.workspaceId;
      const parentId = typeof input === "string" ? undefined : input.parentId;

      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

      const tempFolder = {
        id: `temp-${Math.random()}`,
        name: name,
        parent_id: parentId || null,
        workspace_id: workspaceId || null,
        is_optimistic: true,
        color: null,
      };

      queryClient.getQueryCache().findAll({ queryKey: ["notes-dashboard"] }).forEach(query => {
        const queryWorkspaceId = query.queryKey[1];
        if (workspaceId === (queryWorkspaceId || undefined)) {
          queryClient.setQueryData(query.queryKey, (old: any) => {
            if (!old) return old;
            return {
              ...old,
              folders: [tempFolder, ...(old.folders || [])],
            };
          });
        }
      });

      return { previousDashboards };
    },
    onSuccess: (data) => {
       queryClient.getQueryCache().findAll({ queryKey: ["notes-dashboard"] }).forEach(query => {
         const queryWorkspaceId = query.queryKey[1];
         if (data.workspace_id === (queryWorkspaceId || null)) {
           queryClient.setQueryData(query.queryKey, (old: any) => {
             if (!old) return old;
             const filteredFolders = old.folders?.filter((f: any) => !f.is_optimistic && f.id !== data.id) || [];
             return {
               ...old,
               folders: [data, ...filteredFolders]
             };
           });
         }
       });
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

      queryClient.setQueriesData({ queryKey: ["notes-dashboard"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tags: [...(old.tags || []), { id: `temp-${Math.random()}`, name, color: null, is_optimistic: true }]
        };
      });

      return { previousDashboards };
    },
    onError: (err, name, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async (newValues) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      await queryClient.cancelQueries({ queryKey: ["note-detail", noteId] });

      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });
      const previousNoteDetail = queryClient.getQueryData(["note-detail", noteId]);

      // Optimistically update all dashboard queries
      queryClient.setQueriesData({ queryKey: ["notes-dashboard"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notes: old.notes?.map((n: any) => 
            n.id === noteId ? { 
              ...n, 
              ...newValues,
              folder_id: newValues.folderId !== undefined ? newValues.folderId : n.folder_id,
              is_pinned: newValues.isPinned !== undefined ? newValues.isPinned : n.is_pinned,
              is_published: newValues.isPublished !== undefined ? newValues.isPublished : n.is_published,
              updated_at: new Date().toISOString()
            } : n
          )
        };
      });

      // Optimistically update detail query
      if (previousNoteDetail) {
        queryClient.setQueryData(["note-detail", noteId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            note: { 
              ...old.note, 
              ...newValues,
              folder_id: newValues.folderId !== undefined ? newValues.folderId : old.note.folder_id,
              is_published: newValues.isPublished !== undefined ? newValues.isPublished : old.note.is_published,
              updated_at: new Date().toISOString()
            }
          };
        });
      }

      return { previousDashboards, previousNoteDetail };
    },
    onError: (err, newValues, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousNoteDetail) {
        queryClient.setQueryData(["note-detail", noteId], context.previousNoteDetail);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["note-detail", noteId] });
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
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      await queryClient.cancelQueries({ queryKey: ["note-detail", noteId] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

      queryClient.setQueriesData({ queryKey: ["notes-dashboard"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notes: old.notes?.filter((n: any) => n.id !== noteId)
        };
      });

      return { previousDashboards };
    },
    onError: (err, noteId, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
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
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      await queryClient.cancelQueries({ queryKey: ["archived-items"] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });
      const previousArchived = queryClient.getQueryData(["archived-items"]);

      // We can't easily optimistic restore without knowing the note data,
      // but we can at least remove it from archived list if it exists.
      if (previousArchived) {
        queryClient.setQueryData(["archived-items"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notes: old.notes?.filter((n: any) => n.id !== noteId)
          };
        });
      }

      return { previousDashboards, previousArchived };
    },
    onError: (err, noteId, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(["archived-items"], context.previousArchived);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
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
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: ["archived-items"] });
      const previousArchived = queryClient.getQueryData(["archived-items"]);
      if (previousArchived) {
        queryClient.setQueryData(["archived-items"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            notes: old.notes?.filter((n: any) => n.id !== noteId)
          };
        });
      }
      return { previousArchived };
    },
    onError: (err, noteId, context) => {
      if (context?.previousArchived) {
        queryClient.setQueryData(["archived-items"], context.previousArchived);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
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
    onMutate: async ({ noteId, folderId }) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      await queryClient.cancelQueries({ queryKey: ["note-detail", noteId] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

      queryClient.setQueriesData({ queryKey: ["notes-dashboard"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          notes: old.notes?.map((n: any) => n.id === noteId ? { ...n, folder_id: folderId } : n)
        };
      });

      return { previousDashboards };
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, { noteId }) => {
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
    onMutate: async ({ folderId, name }) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

      queryClient.setQueriesData({ queryKey: ["notes-dashboard"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          folders: old.folders?.map((f: any) => f.id === folderId ? { ...f, name } : f)
        };
      });

      return { previousDashboards };
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async ({ folderId, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

      queryClient.setQueriesData({ queryKey: ["notes-dashboard"] }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          folders: old.folders?.map((f: any) => f.id === folderId ? { ...f, parent_id: parentId } : f)
        };
      });

      return { previousDashboards };
    },
    onError: (err, variables, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });

      queryClient.setQueriesData({ queryKey: ["notes-dashboard"] }, (old: any) => {
        if (!old) return old;
        
        // Find all child folders recursively
        const foldersToRemove = new Set([folderId]);
        let size;
        do {
          size = foldersToRemove.size;
          old.folders?.forEach((f: any) => {
            if (f.parent_id && foldersToRemove.has(f.parent_id)) {
              foldersToRemove.add(f.id);
            }
          });
        } while (foldersToRemove.size > size);

        return {
          ...old,
          folders: old.folders?.filter((f: any) => !foldersToRemove.has(f.id)),
          notes: old.notes?.filter((n: any) => !n.folder_id || !foldersToRemove.has(n.folder_id))
        };
      });

      return { previousDashboards };
    },
    onError: (err, folderId, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
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
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: ["notes-dashboard"] });
      await queryClient.cancelQueries({ queryKey: ["archived-items"] });
      const previousDashboards = queryClient.getQueriesData({ queryKey: ["notes-dashboard"] });
      const previousArchived = queryClient.getQueryData(["archived-items"]);

      if (previousArchived) {
        queryClient.setQueryData(["archived-items"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            folders: old.folders?.filter((f: any) => f.id !== folderId)
          };
        });
      }

      return { previousDashboards, previousArchived };
    },
    onError: (err, folderId, context) => {
      if (context?.previousDashboards) {
        context.previousDashboards.forEach(([queryKey, data]: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(["archived-items"], context.previousArchived);
      }
    },
    onSettled: () => {
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
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: ["archived-items"] });
      const previousArchived = queryClient.getQueryData(["archived-items"]);
      if (previousArchived) {
        queryClient.setQueryData(["archived-items"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            folders: old.folders?.filter((f: any) => f.id !== folderId)
          };
        });
      }
      return { previousArchived };
    },
    onError: (err, folderId, context) => {
      if (context?.previousArchived) {
        queryClient.setQueryData(["archived-items"], context.previousArchived);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-items"] });
    },
  });
}
