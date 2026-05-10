"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  archiveGlobalConversation,
  askAllNotes,
  askGeneralAI,
  askNote,
  clearGlobalConversation,
  embedNote,
  generateSummary,
  getGlobalConversation,
  getNoteConversation,
  listGlobalConversations,
  searchNotes,
  suggestTags,
} from "@/lib/api/ai";
import { createClient, getAccessToken } from "@/lib/supabase/client";

async function getAuthToken() {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("You must be signed in to use AI features.");
  }
  return token;
}

export function useEmbedNote() {
  return useMutation({
    mutationFn: async (noteId: string) => {
      const token = await getAuthToken();
      return embedNote(token, noteId);
    },
  });
}

export function useSemanticSearch() {
  return useMutation({
    mutationFn: async (input: {
      query: string;
      threshold?: number;
      limit?: number;
    }) => {
      const token = await getAuthToken();
      return searchNotes(token, input);
    },
  });
}

export function useAskNote(noteId: string) {
  return useMutation({
    mutationFn: async (
      input:
        | string
        | {
            question?: string;
            messages?: any[];
            conversationId?: string;
            noteId?: string;
          },
    ) => {
      const token = await getAuthToken();
      const payload = typeof input === "string" ? { question: input } : input;
      return askNote(token, noteId, { ...payload, topK: 10 });
    },
  });
}

export function useAskAllNotes() {
  return useMutation({
    mutationFn: async (
      input:
        | string
        | {
            question?: string;
            messages?: any[];
            conversationId?: string;
            noteId?: string;
          },
    ) => {
      const token = await getAuthToken();
      const payload = typeof input === "string" ? { question: input } : input;
      return askAllNotes(token, { ...payload, topK: 15 });
    },
  });
}

export function useNoteConversation(noteId: string) {
  return useMutation({
    mutationFn: async () => {
      const token = await getAuthToken();
      return getNoteConversation(token, noteId);
    },
  });
}

export function useListGlobalConversations(noteId?: string) {
  return useQuery({
    queryKey: ["global-conversations", noteId],
    queryFn: async () => {
      const token = await getAuthToken();
      return listGlobalConversations(token, noteId);
    },
  });
}

export function useGlobalConversation() {
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      return getGlobalConversation(token, id);
    },
  });
}

export function useClearGlobalConversation() {
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      return clearGlobalConversation(token, id);
    },
  });
}

export function useArchiveGlobalConversation() {
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getAuthToken();
      return archiveGlobalConversation(token, id);
    },
  });
}

export function useGenerateSummary(noteId: string) {
  return useMutation({
    mutationFn: async () => {
      const token = await getAuthToken();
      return generateSummary(token, noteId);
    },
  });
}

export function useNoteAITools(noteId: string) {
  return {
    summarize: useGenerateSummary(noteId),
    suggestTags: useSuggestTags(noteId),
  };
}

export function useSuggestTags(noteId: string) {
  return useMutation({
    mutationFn: async () => {
      const token = await getAuthToken();
      return suggestTags(token, noteId);
    },
  });
}

export function useGeneralAiAsk() {
  return useMutation({
    mutationFn: async (question: string) => {
      const token = await getAuthToken();
      return askGeneralAI(token, { question });
    },
  });
}
