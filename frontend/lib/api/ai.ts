import { apiRequest } from "@/lib/api/client";

export type SearchMatch = {
  note_id: string;
  chunk_id: string;
  title: string;
  chunk_text: string;
  heading: string | null;
  similarity: number;
};

export type AskReference = {
  chunkId: string;
  heading: string | null;
  similarity: number;
  excerpt: string;
};

function authHeader(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export function embedNote(accessToken: string, noteId: string) {
  return apiRequest<{
    jobId: string;
    noteId: string;
    chunksCreated: number;
    embeddedAt: string;
  }>(`/api/notes/${noteId}/embed`, {
    method: "POST",
    headers: authHeader(accessToken),
  });
}

export function searchNotes(
  accessToken: string,
  input: { query: string; threshold?: number; limit?: number },
) {
  return apiRequest<{
    query: string;
    threshold: number;
    limit: number;
    matches: SearchMatch[];
  }>("/api/notes/search", {
    method: "POST",
    headers: authHeader(accessToken),
    body: input,
  });
}

export function askNote(
  accessToken: string,
  noteId: string,
  input: { question: string; topK?: number },
) {
  return apiRequest<{
    noteId: string;
    question: string;
    answer: string;
    references: AskReference[];
  }>(`/api/notes/${noteId}/ask`, {
    method: "POST",
    headers: authHeader(accessToken),
    body: input,
  });
}

export function generateSummary(accessToken: string, noteId: string) {
  return apiRequest<{ noteId: string; summary: string }>(
    `/api/notes/${noteId}/summary`,
    {
      method: "POST",
      headers: authHeader(accessToken),
    },
  );
}

export function suggestTags(accessToken: string, noteId: string) {
  return apiRequest<{ noteId: string; tags: string[] }>(
    `/api/notes/${noteId}/suggest-tags`,
    {
      method: "POST",
      headers: authHeader(accessToken),
    },
  );
}
