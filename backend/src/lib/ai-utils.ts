const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CHUNK_CHARS = 1200;

export type Chunk = {
  chunkIndex: number;
  chunkText: string;
  heading: string | null;
  charStart: number;
  charEnd: number;
  tokenCount: number;
};

export type SearchMatch = {
  note_id: string;
  chunk_id: string;
  title: string;
  chunk_text: string;
  heading: string | null;
  similarity: number;
};

export function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

export function splitTextIntoChunks(content: string) {
  const lines = content.split(/\r?\n/);
  const chunks: Chunk[] = [];

  let currentHeading: string | null = null;
  let currentText = "";
  let currentStart = 0;
  let cursor = 0;
  let chunkIndex = 0;

  const pushChunk = () => {
    const text = currentText.trim();
    if (!text) return;

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
      if (!currentText) currentStart = cursor;
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

export function buildExtractiveSummary(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "";

  const sentences = trimmed
    .replace(/\s+/g, " ")
    .split(/(?<=[.!؟?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) return trimmed.slice(0, 320);

  const summaryParts: string[] = [];
  let totalLength = 0;

  for (const sentence of sentences) {
    if (summaryParts.length >= 3 || totalLength + sentence.length > 380) break;
    summaryParts.push(sentence);
    totalLength += sentence.length;
  }

  return summaryParts.join(" ");
}

export function suggestTagsFromText(content: string) {
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

export function rerankSearchMatches(query: string, matches: SearchMatch[], limit: number) {
  const queryTokens = tokenizeQuestion(query);
  const fallbackTokens = queryTokens.length > 0 ? queryTokens : query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const tokens = fallbackTokens.slice(0, 6);

  const scored = matches
    .map((match) => {
      const text = normalizePlainText(`${match.title} ${match.chunk_text}`).toLowerCase();
      const keywordHits = tokens.reduce((acc, token) => acc + (text.includes(token) ? 1 : 0), 0);
      const score = match.similarity + keywordHits * 0.08;
      return { match, keywordHits, score };
    })
    .filter((item) => tokens.length === 0 || item.keywordHits > 0)
    .sort((a, b) => b.score - a.score);

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

export function toVectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value.toFixed(8))).join(",")}]`;
}
