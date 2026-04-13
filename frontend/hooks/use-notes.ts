"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

type NoteListItem = {
  id: string;
  title: string;
  content_text: string | null;
  summary: string | null;
  folder_id: string | null;
  is_pinned: boolean;
  updated_at: string;
  created_at: string;
};

type FolderItem = {
  id: string;
  name: string;
  color: string | null;
};

type TagItem = {
  id: string;
  name: string;
  color: string | null;
};

type NoteTagLink = {
  tag_id: string;
  tags: TagItem | null;
};

type NoteShareItem = {
  id: string;
  note_id: string;
  shared_with_user_id: string | null;
  share_token: string | null;
  can_edit: boolean;
  created_at: string;
  expires_at: string | null;
};

async function getCurrentUserId() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to access notes.");
  }

  return user.id;
}

export function useNotesDashboard() {
  return useQuery({
    queryKey: ["notes-dashboard"],
    queryFn: async () => {
      const supabase = createClient();
      const userId = await getCurrentUserId();

      const [notesRes, foldersRes, tagsRes] = await Promise.all([
        supabase
          .from("notes")
          .select("id,title,content_text,summary,folder_id,is_pinned,updated_at,created_at")
          .eq("user_id", userId)
          .eq("is_archived", false)
          .order("updated_at", { ascending: false }),
        supabase
          .from("folders")
          .select("id,name,color")
          .eq("user_id", userId)
          .order("name", { ascending: true }),
        supabase
          .from("tags")
          .select("id,name,color")
          .eq("user_id", userId)
          .order("name", { ascending: true }),
      ]);

      if (notesRes.error) throw new Error(notesRes.error.message);
      if (foldersRes.error) throw new Error(foldersRes.error.message);
      if (tagsRes.error) throw new Error(tagsRes.error.message);

      return {
        notes: (notesRes.data ?? []) as NoteListItem[],
        folders: (foldersRes.data ?? []) as FolderItem[],
        tags: (tagsRes.data ?? []) as TagItem[],
      };
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title: string; folderId?: string | null }) => {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          title: input.title.trim() || "Untitled note",
          folder_id: input.folderId ?? null,
          content: { type: "doc", content: [] },
          content_text: "",
          updated_at: nowIso,
        })
        .select("id,title")
        .single();

      if (error) throw new Error(error.message);
      return data as { id: string; title: string };
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
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase.from("folders").insert({
        user_id: userId,
        name: name.trim(),
      });
      if (error) throw new Error(error.message);
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
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const { error } = await supabase.from("tags").insert({
        user_id: userId,
        name: name.trim(),
      });
      if (error) throw new Error(error.message);
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
      const supabase = createClient();
      const userId = await getCurrentUserId();

      const [noteRes, foldersRes, tagsRes, noteTagsRes] = await Promise.all([
        supabase
          .from("notes")
          .select("id,title,content,content_text,summary,folder_id,updated_at")
          .eq("id", noteId)
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("folders")
          .select("id,name,color")
          .eq("user_id", userId)
          .order("name", { ascending: true }),
        supabase
          .from("tags")
          .select("id,name,color")
          .eq("user_id", userId)
          .order("name", { ascending: true }),
        supabase
          .from("note_tags")
          .select("tag_id,tags(id,name,color)")
          .eq("note_id", noteId),
      ]);

      if (noteRes.error) throw new Error(noteRes.error.message);
      if (!noteRes.data) throw new Error("Note not found.");
      if (foldersRes.error) throw new Error(foldersRes.error.message);
      if (tagsRes.error) throw new Error(tagsRes.error.message);
      if (noteTagsRes.error) throw new Error(noteTagsRes.error.message);

      const normalizedNoteTags = ((noteTagsRes.data ?? []) as Array<{
        tag_id: string;
        tags: TagItem | TagItem[] | null;
      }>).map((item) => ({
        tag_id: item.tag_id,
        tags: Array.isArray(item.tags) ? (item.tags[0] ?? null) : item.tags,
      }));

      return {
        note: noteRes.data as {
          id: string;
          title: string;
          content: unknown;
          content_text: string | null;
          summary: string | null;
          folder_id: string | null;
          updated_at: string;
        },
        folders: (foldersRes.data ?? []) as FolderItem[],
        tags: (tagsRes.data ?? []) as TagItem[],
        noteTags: normalizedNoteTags as NoteTagLink[],
      };
    },
  });
}

export function useUpdateNote(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { title?: string; html?: string; folderId?: string | null }) => {
      const supabase = createClient();
      const userId = await getCurrentUserId();
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (typeof input.title === "string") {
        updatePayload.title = input.title;
      }
      if (typeof input.html === "string") {
        updatePayload.content = { html: input.html };
        updatePayload.content_text = input.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        updatePayload.word_count = updatePayload.content_text
          ? String(updatePayload.content_text).split(/\s+/).filter(Boolean).length
          : 0;
      }
      if (input.folderId !== undefined) {
        updatePayload.folder_id = input.folderId;
      }

      const { error } = await supabase
        .from("notes")
        .update(updatePayload)
        .eq("id", noteId)
        .eq("user_id", userId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-detail", noteId] });
      queryClient.invalidateQueries({ queryKey: ["notes-dashboard"] });
    },
  });
}

export function useUpdateNoteTags(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagIds: string[]) => {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("note_tags")
        .delete()
        .eq("note_id", noteId);
      if (deleteError) throw new Error(deleteError.message);

      if (tagIds.length > 0) {
        const rows = tagIds.map((tagId) => ({ note_id: noteId, tag_id: tagId }));
        const { error: insertError } = await supabase.from("note_tags").insert(rows);
        if (insertError) throw new Error(insertError.message);
      }
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
      const supabase = createClient();
      const { data, error } = await supabase
        .from("note_shares")
        .select("id,note_id,shared_with_user_id,share_token,can_edit,created_at,expires_at")
        .eq("note_id", noteId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as NoteShareItem[];
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
      const supabase = createClient();
      const payload: Record<string, unknown> = {
        note_id: noteId,
        can_edit: Boolean(input.canEdit),
        expires_at: input.expiresAt ?? null,
      };

      if (input.mode === "user") {
        if (!input.sharedWithUserId?.trim()) {
          throw new Error("Recipient user ID is required.");
        }
        payload.shared_with_user_id = input.sharedWithUserId.trim();
      } else {
        payload.share_token = crypto.randomUUID().replace(/-/g, "");
      }

      const { data, error } = await supabase
        .from("note_shares")
        .insert(payload)
        .select("id,note_id,shared_with_user_id,share_token,can_edit,created_at,expires_at")
        .single();

      if (error) throw new Error(error.message);
      return data as NoteShareItem;
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
      const supabase = createClient();
      const { error } = await supabase
        .from("note_shares")
        .delete()
        .eq("id", shareId)
        .eq("note_id", noteId);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-shares", noteId] });
    },
  });
}
