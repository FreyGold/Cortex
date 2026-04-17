import { apiRequest } from "@/lib/api/client";

type SearchMatch = {
  note_id: string;
  chunk_id: string;
  title: string;
  chunk_text: string;
  heading: string | null;
  similarity: number;
};

type AskReference = {
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
  input: { question?: string; messages?: any[]; topK?: number },
) {
  return apiRequest<{
    noteId: string;
    answer: string;
    references: AskReference[];
    model?: string;
  }>(`/api/notes/${noteId}/ask`, {
    method: "POST",
    headers: authHeader(accessToken),
    body: input,
  });
}

export function getNoteConversation(accessToken: string, noteId: string) {
  return apiRequest<{ messages: any[] }>(`/api/notes/${noteId}/conversation`, {
    method: "GET",
    headers: authHeader(accessToken),
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

export function askGeneralAI(accessToken: string, input: { question: string }) {
  return apiRequest<{ question: string; answer: string; model: string }>(
    "/api/ai/general",
    {
      method: "POST",
      headers: authHeader(accessToken),
      body: input,
    },
  );
}
