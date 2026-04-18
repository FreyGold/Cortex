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
      .select("id")
      .single();
    if (error) throw error;
    return data;
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

  async searchNotes(queryEmbedding: string, userId: string, threshold: number, count: number) {
    const { data, error } = await this.supabase.rpc("search_notes", {
      query_embedding: queryEmbedding,
      user_id_filter: userId,
      match_threshold: threshold,
      match_count: count,
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

  async getGlobalConversation(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from("global_conversations")
        .select("messages")
        .eq("user_id", userId)
        .maybeSingle();
      if (error && error.code === "PGRST116") return null; // Handle not found
      if (error && this.isMissingRelationError(error)) return null; // Table missing
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn("Table global_conversations might be missing:", e);
      return null;
    }
  }

  async upsertGlobalConversation(payload: any) {
    try {
      const { error } = await this.supabase
        .from("global_conversations")
        .upsert(payload, { onConflict: "user_id" });
      if (error && this.isMissingRelationError(error)) {
        console.error("CRITICAL: global_conversations table missing. Migration 013 must be applied.");
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
