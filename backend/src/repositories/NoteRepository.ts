import type { SupabaseClient } from "@supabase/supabase-js";

export class NoteRepository {
  constructor(private supabase: SupabaseClient) {}

  async getDashboardNotes(userId: string) {
    const { data, error } = await this.supabase
      .from("notes")
      .select("id,title,content_text,summary,folder_id,is_pinned,is_published,updated_at,created_at,note_tags(tags(id,name,color))")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getSharedNotes(userId: string) {
    const { data, error } = await this.supabase
      .from("note_shares")
      .select("note:notes(id,title,updated_at,is_pinned,is_published,user_id)")
      .eq("shared_with_user_id", userId)
      .eq("note.is_archived", false);
    if (error) throw error;
    return data?.map(item => item.note).filter(Boolean) || [];
  }

  async getFolders(userId: string) {
    const { data, error } = await this.supabase
      .from("folders")
      .select("id,name,color,parent_id")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("name", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getTags(userId: string) {
    const { data, error } = await this.supabase
      .from("tags")
      .select("id,name,color")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error) throw error;
    return data;
  }

  async createNote(userId: string, title: string, folderId: string | null) {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("notes")
      .insert({
        user_id: userId,
        title: title || "Untitled note",
        folder_id: folderId,
        content: { type: "doc", content: [] },
        content_text: "",
        updated_at: nowIso,
      })
      .select("id,title");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create note.");
    return data[0];
  }

  async createFolder(userId: string, name: string, parentId?: string | null) {
    const { error } = await this.supabase.from("folders").insert({
      user_id: userId,
      name,
      parent_id: parentId || null,
    });
    if (error) throw error;
  }

  async updateFolder(userId: string, folderId: string, updatePayload: Record<string, unknown>) {
    const { error } = await this.supabase
      .from("folders")
      .update(updatePayload)
      .eq("id", folderId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async deleteFolder(userId: string, folderId: string) {
    const { error } = await this.supabase.rpc("archive_folder_recursive", { f_id: folderId });
    if (error) throw error;
  }

  async restoreFolder(userId: string, folderId: string) {
    const { error } = await this.supabase.rpc("restore_folder_recursive", { f_id: folderId });
    if (error) throw error;
  }

  async deleteFolderForever(userId: string, folderId: string) {
    const { error } = await this.supabase
      .from("folders")
      .delete()
      .eq("id", folderId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async getArchivedFolders(userId: string) {
    const { data, error } = await this.supabase
      .from("folders")
      .select("id,name,color,parent_id,archived_at")
      .eq("user_id", userId)
      .eq("is_archived", true)
      .order("archived_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async createTag(userId: string, name: string) {
    const { error } = await this.supabase.from("tags").insert({
      user_id: userId,
      name,
    });
    if (error) throw error;
  }

  async getNoteDetail(userId: string, noteId: string) {
    const { data, error } = await this.supabase
      .from("notes")
      .select("id,title,content,content_text,summary,folder_id,is_published,updated_at")
      .eq("id", noteId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getNoteTags(noteId: string) {
    const { data, error } = await this.supabase
      .from("note_tags")
      .select("tag_id,tags(id,name,color)")
      .eq("note_id", noteId);
    if (error) throw error;
    return data;
  }

  async updateNote(userId: string, noteId: string, updatePayload: Record<string, unknown>) {
    const { error } = await this.supabase
      .from("notes")
      .update(updatePayload)
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async deleteNoteTags(noteId: string) {
    const { error } = await this.supabase.from("note_tags").delete().eq("note_id", noteId);
    if (error) throw error;
  }

  async insertNoteTags(rows: { note_id: string; tag_id: string }[]) {
    const { error } = await this.supabase.from("note_tags").insert(rows);
    if (error) throw error;
  }

  async getNoteShares(noteId: string) {
    const { data, error } = await this.supabase
      .from("note_shares")
      .select("id,note_id,shared_with_user_id,can_edit,created_at,expires_at")
      .eq("note_id", noteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async createNoteShare(payload: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("note_shares")
      .insert(payload)
      .select("id,note_id,shared_with_user_id,can_edit,created_at,expires_at");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create note share.");
    return data[0];
  }

  async deleteNoteShare(noteId: string, shareId: string) {
    const { error } = await this.supabase
      .from("note_shares")
      .delete()
      .eq("id", shareId)
      .eq("note_id", noteId);
    if (error) throw error;
  }

  async getArchivedNotes(userId: string) {
    const { data, error } = await this.supabase
      .from("notes")
      .select("id,title,archived_at,updated_at,folder_id")
      .eq("user_id", userId)
      .eq("is_archived", true)
      .order("archived_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getPublicNoteDetail(noteId: string) {
    const { data, error } = await this.supabase
      .from("notes")
      .select("id,title,content,content_text,updated_at,user_id")
      .eq("id", noteId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async archiveNote(userId: string, noteId: string) {
    const { error } = await this.supabase
      .from("notes")
      .update({
        status: "archived",
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async restoreNote(userId: string, noteId: string) {
    const { error } = await this.supabase
      .from("notes")
      .update({
        status: "active",
        is_archived: false,
        archived_at: null,
      })
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async deleteNoteForever(userId: string, noteId: string) {
    const { error } = await this.supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async createResourceFromNote(courseId: string, userId: string, noteId: string, titleEn: string) {
    const { data, error } = await this.supabase
      .from("resources")
      .insert({
        course_id: courseId,
        uploaded_by: userId,
        note_id: noteId,
        title_en: titleEn,
        type: "note",
      })
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
        throw new Error("Failed to create resource from note. Ensure you have permission.");
    }
    return data[0];
  }
}

