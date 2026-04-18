import { apiRequest } from "./client";

export type NoteListItem = {
  id: string;
  title: string;
  content_text: string | null;
  summary: string | null;
  folder_id: string | null;
  is_pinned: boolean;
  updated_at: string;
  created_at: string;
};

export type FolderItem = {
  id: string;
  name: string;
  color: string | null;
  parent_id: string | null;
};

export type TagItem = {
  id: string;
  name: string;
  color: string | null;
};

export type NoteTagLink = {
  tag_id: string;
  tags: TagItem | null;
};

export type NoteShareItem = {
  id: string;
  note_id: string;
  shared_with_user_id: string | null;
  share_token: string | null;
  can_edit: boolean;
  created_at: string;
  expires_at: string | null;
};

export function getDashboardNotes(accessToken: string) {
  return apiRequest<{
    notes: NoteListItem[];
    folders: FolderItem[];
    tags: TagItem[];
  }>("/api/notes/dashboard", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createNote(accessToken: string, title: string, folderId: string | null) {
  return apiRequest<{ id: string; title: string }>("/api/notes", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { title, folderId },
  });
}

export function createFolder(accessToken: string, name: string) {
  return apiRequest<{ success: boolean }>("/api/notes/folders", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { name },
  });
}

export function updateFolder(
  accessToken: string,
  folderId: string,
  payload: { name?: string; parentId?: string | null; color?: string | null }
) {
  return apiRequest<{ success: boolean }>(`/api/notes/folders/${folderId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function createTag(accessToken: string, name: string) {
  return apiRequest<{ success: boolean }>("/api/notes/tags", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { name },
  });
}

export function getNoteDetail(accessToken: string, noteId: string) {
  return apiRequest<{
    note: {
      id: string;
      title: string;
      content: unknown;
      content_text: string | null;
      summary: string | null;
      folder_id: string | null;
      updated_at: string;
    };
    folders: FolderItem[];
    tags: TagItem[];
    noteTags: NoteTagLink[];
  }>(`/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function updateNote(
  accessToken: string,
  noteId: string,
  payload: { title?: string; html?: string; folderId?: string | null }
) {
  return apiRequest<{ success: boolean }>(`/api/notes/${noteId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function updateNoteTags(accessToken: string, noteId: string, tagIds: string[]) {
  return apiRequest<{ success: boolean }>(`/api/notes/${noteId}/tags`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { tagIds },
  });
}

export function getNoteShares(accessToken: string, noteId: string) {
  return apiRequest<NoteShareItem[]>(`/api/notes/${noteId}/shares`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export function createNoteShare(
  accessToken: string,
  noteId: string,
  payload: {
    mode: "user" | "link";
    sharedWithUserId?: string;
    canEdit?: boolean;
    expiresAt?: string | null;
  }
) {
  return apiRequest<NoteShareItem>(`/api/notes/${noteId}/shares`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  });
}

export function deleteNoteShare(accessToken: string, noteId: string, shareId: string) {
  return apiRequest<{ success: boolean }>(`/api/notes/${noteId}/shares/${shareId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
