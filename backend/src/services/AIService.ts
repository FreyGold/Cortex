import { AIRepository } from "../repositories/AIRepository";
import { 
  splitTextIntoChunks, 
  toVectorLiteral, 
  rerankSearchMatches, 
  buildExtractiveSummary, 
  suggestTagsFromText 
} from "../lib/ai-utils";

type FeatureExtractor = (
  input: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

let featureExtractorPromise: Promise<FeatureExtractor> | null = null;

async function getFeatureExtractor() {
  if (!featureExtractorPromise) {
    featureExtractorPromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      const extractor = await pipeline(
        "feature-extraction",
        "Xenova/multilingual-e5-small",
      );
      return extractor as FeatureExtractor;
    })();
  }
  return featureExtractorPromise;
}

async function embedText(text: string) {
  const extractor = await getFeatureExtractor();
  const result = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  const data = Array.from(result.data);
  if (data.length !== 384) {
    throw new Error(`Embedding dimension mismatch. Expected 384, got ${data.length}`);
  }
  return data;
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

  async askNote(noteId: string, userId: string, currentQuestion: string, messages: any[], requestedTopK: number) {
    const note = await this.repo.getNote(noteId);
    if (!note) throw new Error("Note not found.");

    const queryEmbedding = await embedText(`query: ${currentQuestion.trim()}`);
    const data = await this.repo.searchNotes(toVectorLiteral(queryEmbedding), userId, 0.2, requestedTopK);
    const matches = (data ?? []).filter((item: any) => item.note_id === noteId);

    let contextBlock = "";
    const references: any[] = [];

    if (matches.length === 0) {
      const fullText = note.content_text ?? "";
      contextBlock = fullText.length > 20 ? `[FULL NOTE TEXT]:\n${fullText.slice(0, 15000)}` : "No context.";
    } else {
      contextBlock = matches.map((m: any) => `[RELEVANT PASSAGE]: ${m.chunk_text}`).join("\n\n");
      matches.slice(0, 6).forEach((m: any) => {
        references.push({
          chunkId: m.chunk_id,
          heading: m.heading,
          similarity: m.similarity,
          excerpt: m.chunk_text.slice(0, 300),
        });
      });
    }

    const { answer, model } = await this.chatGeminiWithContext(messages, contextBlock, note.title);

    const updatedMessages = [...messages, { role: "assistant", content: answer }];
    await this.repo.upsertConversation({
      note_id: noteId,
      user_id: userId,
      messages: updatedMessages,
    });

    return { noteId, answer, model, references };
  }

  async askAllNotes(userId: string, currentQuestion: string, messages: any[], requestedTopK: number) {
    const queryEmbedding = await embedText(`query: ${currentQuestion.trim()}`);
    const data = await this.repo.searchNotes(toVectorLiteral(queryEmbedding), userId, 0.15, requestedTopK);
    const matches = data ?? [];

    let contextBlock = "";
    const references: any[] = [];

    if (matches.length === 0) {
      contextBlock = "No relevant context found in your notes.";
    } else {
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

    const { answer, model } = await this.chatGeminiWithContext(messages, contextBlock, "Your Knowledge Base");

    const updatedMessages = [...messages, { role: "assistant", content: answer }];
    await this.repo.upsertGlobalConversation({
      user_id: userId,
      messages: updatedMessages,
    });

    return { answer, model, references };
  }

  async getGlobalConversation(userId: string) {
    const data = await this.repo.getGlobalConversation(userId);
    return data?.messages ?? [];
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
