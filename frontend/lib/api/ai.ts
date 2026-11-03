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
  }>(`/api/ai/notes/${noteId}/embed`, {
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
  }>("/api/ai/library/search", {
    method: "POST",
    headers: authHeader(accessToken),
    body: input,
  });
}

export function askNote(
  accessToken: string,
  noteId: string,
  input: {
    question?: string;
    messages?: any[];
    topK?: number;
    conversationId?: string;
  },
) {
  return apiRequest<{
    noteId: string;
    answer: string;
    model: string;
    references: AskReference[];
    id: string; // The conversation ID
  }>(`/api/ai/notes/${noteId}/ask`, {
    method: "POST",
    headers: authHeader(accessToken),
    body: input,
  });
}

export function askAllNotes(
  accessToken: string,
  input: {
    question?: string;
    messages?: any[];
    topK?: number;
    conversationId?: string;
    noteId?: string;
  },
) {
  return apiRequest<{
    id: string;
    answer: string;
    references: Array<AskReference & { noteId: string; noteTitle: string }>;
    model?: string;
  }>("/api/ai/library/ask", {
    method: "POST",
    headers: authHeader(accessToken),
    body: input,
  });
}

export function listGlobalConversations(accessToken: string, noteId?: string) {
  const url = new URL("/api/ai/library/conversations", window.location.origin);
  url.searchParams.set("t", Date.now().toString());
  if (noteId) url.searchParams.set("noteId", noteId);

  return apiRequest<any[]>(url.pathname + url.search, {
    method: "GET",
    headers: authHeader(accessToken),
  });
}

export function getGlobalConversation(accessToken: string, id: string) {
  return apiRequest<{ messages: any[] }>(
    `/api/ai/library/conversations/${id}`,
    {
      method: "GET",
      headers: authHeader(accessToken),
    },
  );
}

export function archiveGlobalConversation(accessToken: string, id: string) {
  return apiRequest<{ success: boolean }>(
    `/api/ai/library/conversations/${id}/archive`,
    {
      method: "PUT",
      headers: authHeader(accessToken),
    },
  );
}

export function clearGlobalConversation(accessToken: string, id: string) {
  return apiRequest<{ success: boolean }>(
    `/api/ai/library/conversations/${id}`,
    {
      method: "DELETE",
      headers: authHeader(accessToken),
    },
  );
}

export function getNoteConversation(accessToken: string, noteId: string) {
  return apiRequest<{ messages: any[] }>(
    `/api/ai/notes/${noteId}/conversation`,
    {
      method: "GET",
      headers: authHeader(accessToken),
    },
  );
}

export function generateSummary(accessToken: string, noteId: string) {
  return apiRequest<{ noteId: string; summary: string }>(
    `/api/ai/notes/${noteId}/summary`,
    {
      method: "POST",
      headers: authHeader(accessToken),
    },
  );
}

export function suggestTags(accessToken: string, noteId: string) {
  return apiRequest<{ noteId: string; tags: string[] }>(
    `/api/ai/notes/${noteId}/suggest-tags`,
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
