import type { SupabaseClient } from "@supabase/supabase-js";

export class AIRepository {
  constructor(private supabase: SupabaseClient) {}

  private isMissingRelationError(error: any) {
    const message = String(error?.message ?? "");
    return (
      error?.code === "PGRST205" ||
      error?.code === "42P01" ||
      /could not find .*global_conversations/i.test(message) ||
      /relation .*global_conversations.* does not exist/i.test(message) ||
      /does not exist/i.test(message)
    );
  }

  async getNote(noteId: string) {
    const { data, error } = await this.supabase
      .from("notes")
      .select("id,user_id,title,content_text,summary")
      .eq("id", noteId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createEmbeddingJob(payload: any) {
    const { data, error } = await this.supabase
      .from("embedding_jobs")
      .insert(payload)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create embedding job.");
    return data[0];
  }

  async clearNoteChunks(note_id: string) {
    const { error } = await this.supabase
      .from("note_chunks")
      .delete()
      .eq("note_id", note_id);
    if (error) throw error;
  }

  async insertNoteChunks(rows: any[]) {
    const { error } = await this.supabase.from("note_chunks").insert(rows);
    if (error) throw error;
  }

  async updateNoteEmbeddingState(noteId: string, userId: string, nowIso: string) {
    const { error } = await this.supabase
      .from("notes")
      .update({ is_embedded: true, embedded_at: nowIso })
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async updateEmbeddingJob(jobId: string, updates: any) {
    const { error } = await this.supabase
      .from("embedding_jobs")
      .update(updates)
      .eq("id", jobId);
    if (error) throw error;
  }

  async searchNotes(queryEmbedding: string, userId: string, threshold: number, count: number, noteId?: string) {
    const { data, error } = await this.supabase.rpc("search_notes", {
      query_embedding: queryEmbedding,
      user_id_filter: userId,
      match_threshold: threshold,
      match_count: count,
      note_id_filter: noteId || null,
    });
    if (error) throw error;
    return data;
  }

  async getConversation(noteId: string, userId: string) {
    const { data, error } = await this.supabase
      .from("note_conversations")
      .select("messages")
      .eq("note_id", noteId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async upsertConversation(payload: any) {
    const { error } = await this.supabase
      .from("note_conversations")
      .upsert(payload, { onConflict: "note_id, user_id" });
    if (error) throw error;
  }

  async getGlobalConversation(id: string) {
    try {
      const { data, error } = await this.supabase
        .from("global_conversations")
        .select("id, messages, title, note_id")
        .eq("id", id)
        .maybeSingle();
      if (error && error.code === "PGRST116") return null;
      if (error && this.isMissingRelationError(error)) return null;
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Failed to get global conversation:", e);
      return null;
    }
  }

  async listGlobalConversations(userId: string, noteId?: string) {
    try {
      let query = this.supabase
        .from("global_conversations")
        .select(`
          *,
          notes:note_id (title)
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (noteId) {
        query = query.eq("note_id", noteId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[AIRepository] List error:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        ...item,
        note_title: item.notes?.title || (item.note_id ? "Linked Note" : "All Notes")
      }));
    } catch (e) {
      console.error("[AIRepository] Critical failure:", e);
      return [];
    }
  }

  async archiveGlobalConversation(id: string) {
    try {
      const { error } = await this.supabase
        .from("global_conversations")
        .update({ status: "archived", archived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to archive conversation:", e);
    }
  }

  async clearGlobalConversation(id: string) {
    try {
      const { error } = await this.supabase
        .from("global_conversations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (e) {
      console.error("Failed to delete conversation:", e);
    }
  }

  async upsertGlobalConversation(payload: any) {
    try {
      const { error } = await this.supabase
        .from("global_conversations")
        .upsert(payload);
      if (error && this.isMissingRelationError(error)) {
        console.error("CRITICAL: global_conversations table missing.");
        return;
      }
      if (error) throw error;
    } catch (e) {
      console.error("Failed to upsert global conversation:", e);
    }
  }

  async updateNote(noteId: string, userId: string, updates: any) {
    const { error } = await this.supabase
      .from("notes")
      .update(updates)
      .eq("id", noteId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}
