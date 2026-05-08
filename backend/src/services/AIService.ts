import { randomUUID } from "node:crypto";
import { AIRepository } from "../repositories/AIRepository";
import { 
  splitTextIntoChunks, 
  toVectorLiteral, 
  rerankSearchMatches, 
  buildExtractiveSummary, 
  suggestTagsFromText 
} from "../lib/ai-utils";

export async function embedText(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY for embeddings");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        outputDimensionality: 384,
      }),
    }
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gemini Embedding request failed.");
  }

  const embedding = payload.embedding?.values;
  if (!embedding || embedding.length !== 384) {
    throw new Error(`Embedding dimension mismatch. Expected 384, got ${embedding?.length}`);
  }
  return embedding;
}

export class AIService {
  constructor(private repo: AIRepository) {}

  async embedNote(noteId: string, userId: string) {
    const note = await this.repo.getNote(noteId);
    if (!note) throw new Error("Note not found.");

    const content = note.content_text?.trim() ?? "";
    if (!content) throw new Error("Note has no text content to embed.");

    const chunks = splitTextIntoChunks(content);
    if (chunks.length === 0) throw new Error("No valid chunks generated from note.");

    const job = await this.repo.createEmbeddingJob({
      note_id: noteId,
      triggered_by: userId,
      status: "processing",
      attempts: 1,
    });

    const jobId = job.id;

    try {
      await this.repo.clearNoteChunks(noteId);
      const rows = [];
      for (const chunk of chunks) {
        const embedding = await embedText(`passage: ${chunk.chunkText}`);
        rows.push({
          note_id: noteId,
          chunk_index: chunk.chunkIndex,
          chunk_text: chunk.chunkText,
          heading: chunk.heading,
          embedding: toVectorLiteral(embedding),
          char_start: chunk.charStart,
          char_end: chunk.charEnd,
          token_count: chunk.tokenCount,
        });
      }

      await this.repo.insertNoteChunks(rows);
      const nowIso = new Date().toISOString();
      await this.repo.updateNoteEmbeddingState(noteId, userId, nowIso);
      await this.repo.updateEmbeddingJob(jobId, {
        status: "completed",
        chunks_created: rows.length,
        completed_at: nowIso,
        error_message: null,
      });

      return { jobId, noteId, chunksCreated: rows.length, embeddedAt: nowIso };
    } catch (error: any) {
      await this.repo.updateEmbeddingJob(jobId, {
        status: "failed",
        error_message: error.message.slice(0, 1000),
        completed_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  async searchNotes(userId: string, query: string, threshold: number, limit: number) {
    const embedding = await embedText(`query: ${query.trim()}`);
    const candidateCount = Math.min(limit * 4, 50);
    const data = await this.repo.searchNotes(toVectorLiteral(embedding), userId, threshold, candidateCount);
    return rerankSearchMatches(query.trim(), data ?? [], limit);
  }

  async getConversation(noteId: string, userId: string) {
    const data = await this.repo.getConversation(noteId, userId);
    return data?.messages ?? [];
  }

  async askNote(noteId: string, userId: string, currentQuestion: string, messages: any[], requestedTopK: number, conversationId?: string) {
    // We strictly use the askAllNotes logic but force the noteId scoping
    return this.askAllNotes(userId, currentQuestion, messages, requestedTopK, conversationId, noteId);
  }

  async askAllNotes(userId: string, currentQuestion: string, messages: any[], requestedTopK: number, conversationId?: string, noteId?: string) {
    const queryEmbedding = await embedText(`query: ${currentQuestion.trim()}`);
    const matches = await this.repo.searchNotes(toVectorLiteral(queryEmbedding), userId, 0.15, requestedTopK, noteId);

    let contextBlock = "";
    const references: any[] = [];

    if (matches && matches.length > 0) {
      contextBlock = matches.map((m: any) => `[FROM NOTE: ${m.title}]: ${m.chunk_text}`).join("\n\n");
      const seenNoteIds = new Set<string>();
      for (const m of matches.slice(0, 10)) {
        if (seenNoteIds.has(m.note_id)) continue;
        seenNoteIds.add(m.note_id);
        references.push({
          noteId: m.note_id,
          noteTitle: m.title,
          chunkId: m.chunk_id,
          heading: m.heading,
          similarity: m.similarity,
          excerpt: m.chunk_text.slice(0, 300),
        });
      }
    }

    // FALLBACK: If noteId is provided and context is thin, pull the whole note
    if (noteId && (!matches || matches.length < 5)) {
      try {
        const note = await this.repo.getNote(noteId);
        if (note && note.content_text) {
          const rawContent = note.content_text.slice(0, 40000); // Respect LLM limits
          const fallbackLabel = matches && matches.length > 0 ? "\n\n[ADDITIONAL FULL NOTE CONTEXT]:" : "[FULL NOTE CONTEXT]:";
          contextBlock += `${fallbackLabel}\n${rawContent}`;
          
          // Ensure we have a reference to the note if none were found via vector
          if (references.length === 0) {
            references.push({
              noteId: note.id,
              noteTitle: note.title,
              excerpt: (note.content_text || "").slice(0, 300),
              similarity: 1.0,
              isFallback: true
            });
          }
        }
      } catch (e) {
        console.error("[AIService] Fallback context error:", e);
      }
    }

    if (!contextBlock) {
      contextBlock = "No relevant context found in your notes.";
    }

    const { answer, model } = await this.chatGeminiWithContext(messages, contextBlock, "Your Knowledge Base");

    const updatedMessages = [...messages, { role: "assistant", content: answer, references }];
    const id = conversationId || randomUUID();
    
    // Generate a title from the first user message if this is a new conversation
    let title: string | undefined = undefined;
    if (!conversationId) {
      const firstUserMsg = messages.find(m => m.role === "user");
      if (firstUserMsg) {
        title = firstUserMsg.content.slice(0, 60).trim();
      }
    }
    
    await this.repo.upsertGlobalConversation({
      id,
      user_id: userId,
      note_id: noteId || undefined,
      messages: updatedMessages,
      title: title || undefined,
      status: "active",
      updated_at: new Date().toISOString(),
    });

    return { id, answer, model, references };
  }

  async archiveGlobalConversation(id: string) {
    await this.repo.archiveGlobalConversation(id);
  }

  async clearGlobalConversation(id: string) {
    await this.repo.clearGlobalConversation(id);
  }

  async listGlobalConversations(userId: string, noteId?: string) {
    return this.repo.listGlobalConversations(userId, noteId);
  }

  async getGlobalConversation(id: string) {
    const data = await this.repo.getGlobalConversation(id);
    return data?.messages ?? [];
  }

  async getSpecificGlobalConversation(id: string) {
    return this.repo.getGlobalConversation(id);
  }

  private async chatGeminiWithContext(messages: any[], context: string, noteTitle: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
    const contents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const systemPrompt = `You are a helpful academic assistant research expert. Below is context from a user's note titled "${noteTitle}".
Answer the user's questions using ONLY the provided context where possible. Match the user's language.

CONTEXT FROM NOTES:
${context}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.45, topP: 0.9, maxOutputTokens: 2048 },
        }),
      }
    );

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "Gemini Chat request failed.");

    const answer = payload.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("").trim() ?? "";
    if (!answer) throw new Error("Gemini returned no response.");

    return { answer, model };
  }

  async askGeneral(question: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const model = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "You are a helpful academic assistant." }] },
          contents: [{ role: "user", parts: [{ text: question }] }],
          generationConfig: { temperature: 0.35, topP: 0.9 },
        }),
      }
    );

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "Gemini request failed.");
    const answer = payload.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("").trim() ?? "";
    return { answer, model };
  }

  async summarizeNote(noteId: string, userId: string) {
    const note = await this.repo.getNote(noteId);
    if (!note) throw new Error("Note not found.");
    const content = note.content_text?.trim() ?? "";
    const summary = buildExtractiveSummary(content);
    if (!summary) throw new Error("Unable to generate summary.");
    await this.repo.updateNote(noteId, userId, { summary });
    return summary;
  }

  async suggestTags(noteId: string, userId: string) {
    const note = await this.repo.getNote(noteId);
    if (!note) throw new Error("Note not found.");
    const content = note.content_text?.trim() ?? "";
    const tags = suggestTagsFromText(content);
    if (tags.length === 0) throw new Error("Unable to generate tags.");
    await this.repo.updateNote(noteId, userId, { suggested_tags: tags });
    return tags;
  }
}
