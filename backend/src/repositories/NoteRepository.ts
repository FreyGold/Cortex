import type { SupabaseClient } from "@supabase/supabase-js";

export class NoteRepository {
  constructor(private supabase: SupabaseClient) {}

  async getDashboardNotes(userId: string) {
    const { data, error } = await this.supabase
      .from("notes")
      .select("id,title,content_text,summary,folder_id,is_pinned,updated_at,created_at,note_tags(tags(id,name,color))")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getFolders(userId: string) {
    const { data, error } = await this.supabase
      .from("folders")
      .select("id,name,color,parent_id")
      .eq("user_id", userId)
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
      .select("id,title")
      .single();
    if (error) throw error;
    return data;
  }

  async createFolder(userId: string, name: string) {
    const { error } = await this.supabase.from("folders").insert({
      user_id: userId,
      name,
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
      .select("id,title,content,content_text,summary,folder_id,updated_at")
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
      .select("id,note_id,shared_with_user_id,share_token,can_edit,created_at,expires_at")
      .eq("note_id", noteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async createNoteShare(payload: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from("note_shares")
      .insert(payload)
      .select("id,note_id,shared_with_user_id,share_token,can_edit,created_at,expires_at")
      .single();
    if (error) throw error;
    return data;
  }

  async deleteNoteShare(noteId: string, shareId: string) {
    const { error } = await this.supabase
      .from("note_shares")
      .delete()
      .eq("id", shareId)
      .eq("note_id", noteId);
    if (error) throw error;
  }
}
