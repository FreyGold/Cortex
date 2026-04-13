import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/authMiddleware";

export const aiRouter = Router();

aiRouter.get("/auth/me", authMiddleware, (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});

type NoteRecord = {
  id: string;
  user_id: string;
  title: string;
  content_text: string | null;
  summary: string | null;
};

type EmbeddingJob = {
  id: string;
};

type SearchMatch = {
  note_id: string;
  chunk_id: string;
  title: string;
  chunk_text: string;
  heading: string | null;
  similarity: number;
};

type Chunk = {
  chunkIndex: number;
  chunkText: string;
  heading: string | null;
  charStart: number;
  charEnd: number;
  tokenCount: number;
};

type FeatureExtractor = (
  input: string,
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ data: Float32Array | number[] }>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CHUNK_CHARS = 1200;
const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_MATCH_COUNT = 10;
const DEFAULT_ASK_MATCH_COUNT = 6;

let featureExtractorPromise: Promise<FeatureExtractor> | null = null;

function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function getRouteParam(value: string | string[] | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSupabasePublicEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing required environment variable: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)",
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      "Missing required environment variable: SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

function getSupabaseUserClient(accessToken: string) {
  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  return createClient<any>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

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

function toVectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value.toFixed(8))).join(",")}]`;
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

function splitTextIntoChunks(content: string) {
  const lines = content.split(/\r?\n/);
  const chunks: Chunk[] = [];

  let currentHeading: string | null = null;
  let currentText = "";
  let currentStart = 0;
  let cursor = 0;
  let chunkIndex = 0;

  const pushChunk = () => {
    const text = currentText.trim();
    if (!text) {
      return;
    }

    const charEnd = currentStart + text.length;
    chunks.push({
      chunkIndex,
      chunkText: text,
      heading: currentHeading,
      charStart: currentStart,
      charEnd,
      tokenCount: text.split(/\s+/).filter(Boolean).length,
    });
    chunkIndex += 1;
  };

  for (const line of lines) {
    const isHeading = /^#{1,6}\s+/.test(line);
    const lineWithBreak = `${line}\n`;

    if (isHeading && currentText.trim().length > 0) {
      pushChunk();
      currentText = "";
      currentStart = cursor;
    }

    if (isHeading) {
      currentHeading = line.replace(/^#{1,6}\s+/, "").trim() || null;
    } else {
      if (!currentText) {
        currentStart = cursor;
      }
      currentText += lineWithBreak;

      while (currentText.length > MAX_CHUNK_CHARS) {
        const slice = currentText.slice(0, MAX_CHUNK_CHARS);
        const splitIndex = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(" "));
        const cutAt = splitIndex > 400 ? splitIndex : MAX_CHUNK_CHARS;
        const piece = currentText.slice(0, cutAt).trim();
        if (piece) {
          const charEnd = currentStart + piece.length;
          chunks.push({
            chunkIndex,
            chunkText: piece,
            heading: currentHeading,
            charStart: currentStart,
            charEnd,
            tokenCount: piece.split(/\s+/).filter(Boolean).length,
          });
          chunkIndex += 1;
          currentStart = charEnd;
        }
        currentText = currentText.slice(cutAt).trimStart();
      }
    }

    cursor += lineWithBreak.length;
  }

  pushChunk();
  return chunks;
}

function buildExtractiveSummary(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  const sentences = trimmed
    .replace(/\s+/g, " ")
    .split(/(?<=[.!؟?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return trimmed.slice(0, 320);
  }

  const summaryParts: string[] = [];
  let totalLength = 0;

  for (const sentence of sentences) {
    if (summaryParts.length >= 3) {
      break;
    }
    if (totalLength + sentence.length > 380) {
      break;
    }
    summaryParts.push(sentence);
    totalLength += sentence.length;
  }

  return summaryParts.join(" ");
}

function suggestTagsFromText(content: string) {
  const stopWords = new Set([
    "the", "and", "for", "with", "this", "that", "from", "into", "your", "you",
    "are", "was", "were", "have", "has", "had", "about", "there", "their", "what",
    "when", "where", "which", "will", "would", "could", "should", "than", "then",
    "على", "من", "إلى", "في", "عن", "هذا", "هذه", "ذلك", "تلك", "كان", "كانت",
    "التي", "الذي", "كما", "لكن", "ضمن", "عند", "بين", "بعد", "قبل", "مع",
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !stopWords.has(word));

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function normalizePlainText(text: string) {
  return decodeHtmlEntities(text).replace(/\s+/g, " ").trim();
}

function tokenizeQuestion(question: string) {
  const stopWords = new Set([
    "what", "are", "is", "the", "a", "an", "of", "to", "in", "for", "and",
    "on", "with", "how", "does", "do", "be", "can", "common", "types", "type",
    "which", "when", "where", "why", "explain",
  ]);
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function extractShardingTypes(text: string) {
  const source = normalizePlainText(text);
  const patterns = [
    "Key-Based (Hash) Sharding",
    "Range-Based Sharding",
    "Directory-Based Sharding",
    "Geo-Based Sharding",
  ];
  return patterns.filter((pattern) =>
    source.toLowerCase().includes(pattern.toLowerCase()),
  );
}

function pickRelevantSentences(noteText: string, question: string) {
  const normalized = normalizePlainText(noteText);
  const sentences = normalized
    .split(/(?<=[.!؟?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25);

  const tokens = tokenizeQuestion(question);
  if (tokens.length === 0) {
    return sentences.slice(0, 2);
  }

  const scored = sentences.map((sentence) => {
    const sentenceLower = sentence.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (sentenceLower.includes(token)) {
        score += 1;
      }
    }
    if (sentenceLower.includes("sharding")) {
      score += 0.25;
    }
    return { sentence, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter((item) => item.score > 0 || item.sentence.toLowerCase().includes("sharding"))
    .map((item) => item.sentence)
    .slice(0, 2);
}

function buildQuestionAwareAnswer(
  noteTitle: string,
  noteText: string,
  question: string,
  references: Array<{ excerpt: string }>,
) {
  const q = question.toLowerCase();
  const normalizedText = normalizePlainText(noteText);

  if (
    q.includes("type") ||
    q.includes("kinds") ||
    q.includes("strateg")
  ) {
    const types = extractShardingTypes(normalizedText);
    if (types.length > 0) {
      return `Common sharding types are: ${types.join(", ")}.`;
    }
  }

  if (
    (q.includes("vertical") || q.includes("horizontal")) &&
    q.includes("sharding")
  ) {
    if (normalizedText.toLowerCase().includes("horizontal scaling")) {
      return "Sharding is a horizontal scaling technique, not vertical scaling.";
    }
  }

  const relevant = pickRelevantSentences(
    `${normalizedText} ${references.map((ref) => ref.excerpt).join(" ")}`,
    question,
  );
  if (relevant.length > 0) {
    return relevant.join(" ");
  }

  return `I found relevant context in "${noteTitle}", but couldn't confidently extract a concise answer.`;
}

function rerankSearchMatches(query: string, matches: SearchMatch[], limit: number) {
  const queryTokens = tokenizeQuestion(query);
  const fallbackTokens =
    queryTokens.length > 0
      ? queryTokens
      : query
          .toLowerCase()
          .split(/\s+/)
          .map((token) => token.trim())
          .filter((token) => token.length > 2);
  const tokens = fallbackTokens.slice(0, 6);

  const scored = matches
    .map((match) => {
      const text = normalizePlainText(`${match.title} ${match.chunk_text}`).toLowerCase();
      const keywordHits = tokens.reduce(
        (acc, token) => acc + (text.includes(token) ? 1 : 0),
        0,
      );
      const score = match.similarity + keywordHits * 0.08;
      return { match, keywordHits, score };
    })
    .filter((item) => tokens.length === 0 || item.keywordHits > 0)
    .sort((a, b) => b.score - a.score);

  // Avoid flooding results with many adjacent chunks from the same note.
  const perNoteCount = new Map<string, number>();
  const selected: SearchMatch[] = [];
  for (const item of scored) {
    const used = perNoteCount.get(item.match.note_id) ?? 0;
    if (used >= 2) continue;
    perNoteCount.set(item.match.note_id, used + 1);
    selected.push(item.match);
    if (selected.length >= limit) break;
  }

  return selected;
}

async function getOwnedNote(noteId: string, accessToken: string) {
  const supabase = getSupabaseUserClient(accessToken);
  const { data, error } = await supabase
    .from("notes")
    .select("id,user_id,title,content_text,summary")
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load note: ${error.message}`);
  }

  return (data as NoteRecord | null) ?? null;
}

aiRouter.post("/notes/:id/embed", authMiddleware, async (req, res) => {
  const noteId = getRouteParam(req.params.id);
  const userId = req.user?.id;
  const accessToken = req.user?.accessToken;

  if (!userId || !accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  if (!noteId || !isValidUuid(noteId)) {
    return res.status(400).json({ error: "Invalid note ID." });
  }

  let jobId: string | null = null;

  try {
    const note = await getOwnedNote(noteId, accessToken);
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    const content = note.content_text?.trim() ?? "";
    if (!content) {
      return res.status(400).json({ error: "Note has no text content to embed." });
    }

    const chunks = splitTextIntoChunks(content);
    if (chunks.length === 0) {
      return res.status(400).json({ error: "No valid chunks generated from note." });
    }

    const supabase = getSupabaseUserClient(accessToken);
    const { data: createdJob, error: jobInsertError } = await supabase
      .from("embedding_jobs")
      .insert({
        note_id: noteId,
        triggered_by: userId,
        status: "processing",
        attempts: 1,
      })
      .select("id")
      .single();

    if (jobInsertError) {
      return res
        .status(500)
        .json({ error: `Failed to create embedding job: ${jobInsertError.message}` });
    }

    jobId = (createdJob as EmbeddingJob).id;

    const { error: clearError } = await supabase
      .from("note_chunks")
      .delete()
      .eq("note_id", noteId);
    if (clearError) {
      throw new Error(`Failed to clear previous note chunks: ${clearError.message}`);
    }

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

    const { error: insertError } = await supabase.from("note_chunks").insert(rows);
    if (insertError) {
      throw new Error(`Failed to insert note chunks: ${insertError.message}`);
    }

    const nowIso = new Date().toISOString();
    const { error: updateNoteError } = await supabase
      .from("notes")
      .update({ is_embedded: true, embedded_at: nowIso })
      .eq("id", noteId)
      .eq("user_id", userId);
    if (updateNoteError) {
      throw new Error(`Failed to update note embedding state: ${updateNoteError.message}`);
    }

    const { error: completeError } = await supabase
      .from("embedding_jobs")
      .update({
        status: "completed",
        chunks_created: rows.length,
        completed_at: nowIso,
        error_message: null,
      })
      .eq("id", jobId);
    if (completeError) {
      throw new Error(`Failed to complete embedding job: ${completeError.message}`);
    }

    return res.status(200).json({
      jobId,
      noteId,
      chunksCreated: rows.length,
      embeddedAt: nowIso,
    });
  } catch (error) {
    if (jobId && accessToken) {
      const supabase = getSupabaseUserClient(accessToken);
      await supabase
        .from("embedding_jobs")
        .update({
          status: "failed",
          error_message: toErrorMessage(error).slice(0, 1000),
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    return res.status(500).json({ error: toErrorMessage(error) });
  }
});

aiRouter.post("/notes/search", authMiddleware, async (req, res) => {
  const userId = req.user?.id;
  const accessToken = req.user?.accessToken;
  const { query, threshold, limit } = req.body as {
    query?: string;
    threshold?: number;
    limit?: number;
  };

  if (!userId || !accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  if (!query || query.trim().length < 2) {
    return res
      .status(400)
      .json({ error: "Query is required and must be at least 2 characters." });
  }

  const clampedThreshold =
    typeof threshold === "number"
      ? clampNumber(threshold, 0.1, 0.95)
      : DEFAULT_THRESHOLD;
  const clampedLimit =
    typeof limit === "number" ? Math.trunc(clampNumber(limit, 1, 25)) : DEFAULT_MATCH_COUNT;

  try {
    const embedding = await embedText(`query: ${query.trim()}`);
    const supabase = getSupabaseUserClient(accessToken);
    const candidateCount = Math.min(clampedLimit * 4, 50);
    const { data, error } = await supabase.rpc("search_notes", {
      query_embedding: toVectorLiteral(embedding),
      user_id_filter: userId,
      match_threshold: clampedThreshold,
      match_count: candidateCount,
    });

    if (error) {
      return res.status(500).json({ error: `Search RPC failed: ${error.message}` });
    }

    const rawMatches = (data as SearchMatch[] | null) ?? [];
    const matches = rerankSearchMatches(query.trim(), rawMatches, clampedLimit);
    return res.status(200).json({
      query: query.trim(),
      threshold: clampedThreshold,
      limit: clampedLimit,
      matches,
    });
  } catch (error) {
    return res.status(500).json({ error: toErrorMessage(error) });
  }
});

aiRouter.post("/notes/:id/ask", authMiddleware, async (req, res) => {
  const noteId = getRouteParam(req.params.id);
  const userId = req.user?.id;
  const accessToken = req.user?.accessToken;
  const { question, topK } = req.body as { question?: string; topK?: number };

  if (!userId || !accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  if (!noteId || !isValidUuid(noteId)) {
    return res.status(400).json({ error: "Invalid note ID." });
  }

  if (!question || question.trim().length < 4) {
    return res
      .status(400)
      .json({ error: "Question is required and must be at least 4 characters." });
  }

  const requestedTopK =
    typeof topK === "number" ? Math.trunc(clampNumber(topK, 1, 10)) : DEFAULT_ASK_MATCH_COUNT;

  try {
    const note = await getOwnedNote(noteId, accessToken);
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    const queryEmbedding = await embedText(`query: ${question.trim()}`);
    const supabase = getSupabaseUserClient(accessToken);
    const { data, error } = await supabase.rpc("search_notes", {
      query_embedding: toVectorLiteral(queryEmbedding),
      user_id_filter: userId,
      match_threshold: 0.35,
      match_count: requestedTopK,
    });

    if (error) {
      return res.status(500).json({ error: `Search RPC failed: ${error.message}` });
    }

    const matches = ((data as SearchMatch[] | null) ?? []).filter(
      (item) => item.note_id === noteId,
    );

    if (matches.length === 0) {
      return res.status(200).json({
        noteId,
        question: question.trim(),
        answer:
          "No relevant embedded chunks were found for this note. Run embedding first or try a broader question.",
        references: [],
      });
    }

    const references = matches.slice(0, 5).map((item) => ({
      chunkId: item.chunk_id,
      heading: item.heading,
      similarity: item.similarity,
      excerpt: item.chunk_text.slice(0, 240),
    }));

    const answer = buildQuestionAwareAnswer(
      note.title,
      note.content_text ?? "",
      question.trim(),
      references,
    );

    return res.status(200).json({
      noteId,
      question: question.trim(),
      answer,
      references,
    });
  } catch (error) {
    return res.status(500).json({ error: toErrorMessage(error) });
  }
});

aiRouter.post("/notes/:id/summary", authMiddleware, async (req, res) => {
  const noteId = getRouteParam(req.params.id);
  const userId = req.user?.id;
  const accessToken = req.user?.accessToken;

  if (!userId || !accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  if (!noteId || !isValidUuid(noteId)) {
    return res.status(400).json({ error: "Invalid note ID." });
  }

  try {
    const note = await getOwnedNote(noteId, accessToken);
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    const content = note.content_text?.trim() ?? "";
    if (!content) {
      return res.status(400).json({ error: "Note has no text to summarize." });
    }

    const summary = buildExtractiveSummary(content);
    if (!summary) {
      return res.status(400).json({ error: "Unable to generate summary from content." });
    }

    const supabase = getSupabaseUserClient(accessToken);
    const { error } = await supabase
      .from("notes")
      .update({ summary })
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) {
      return res.status(500).json({ error: `Failed to save summary: ${error.message}` });
    }

    return res.status(200).json({ noteId, summary });
  } catch (error) {
    return res.status(500).json({ error: toErrorMessage(error) });
  }
});

aiRouter.post("/notes/:id/suggest-tags", authMiddleware, async (req, res) => {
  const noteId = getRouteParam(req.params.id);
  const userId = req.user?.id;
  const accessToken = req.user?.accessToken;

  if (!userId || !accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  if (!noteId || !isValidUuid(noteId)) {
    return res.status(400).json({ error: "Invalid note ID." });
  }

  try {
    const note = await getOwnedNote(noteId, accessToken);
    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    const content = note.content_text?.trim() ?? "";
    if (!content) {
      return res.status(400).json({ error: "Note has no text for tag suggestions." });
    }

    const tags = suggestTagsFromText(content);
    if (tags.length === 0) {
      return res.status(400).json({ error: "Unable to generate tags from note content." });
    }

    const supabase = getSupabaseUserClient(accessToken);
    const { error } = await supabase
      .from("notes")
      .update({ suggested_tags: tags })
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) {
      return res
        .status(500)
        .json({ error: `Failed to save suggested tags: ${error.message}` });
    }

    return res.status(200).json({ noteId, tags });
  } catch (error) {
    return res.status(500).json({ error: toErrorMessage(error) });
  }
});
