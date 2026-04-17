"use client";

import { useMutation } from "@tanstack/react-query";
import {
  askGeneralAI,
  askNote,
  getNoteConversation,
  embedNote,
  generateSummary,
  searchNotes,
  suggestTags,
} from "@/lib/api/ai";
import { createClient } from "@/lib/supabase/client";

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error("You must be signed in to use AI features.");
  }
  return session.access_token;
}

export function useEmbedNote() {
  return useMutation({
    mutationFn: async (noteId: string) => {
      const token = await getAccessToken();
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
      const token = await getAccessToken();
      return searchNotes(token, input);
    },
  });
}

export function useAskNote(noteId: string) {
  return useMutation({
    mutationFn: async (
      input: string | { question?: string; messages?: any[] },
    ) => {
      const token = await getAccessToken();
      const payload = typeof input === "string" ? { question: input } : input;
      return askNote(token, noteId, { ...payload, topK: 10 });
    },
  });
}

export function useNoteConversation(noteId: string) {
  return useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return getNoteConversation(token, noteId);
    },
  });
}

export function useGenerateSummary(noteId: string) {
  return useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return generateSummary(token, noteId);
    },
  });
}

export function useSuggestTags(noteId: string) {
  return useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      return suggestTags(token, noteId);
    },
  });
}

export function useGeneralAiAsk() {
  return useMutation({
    mutationFn: async (question: string) => {
      const token = await getAccessToken();
      return askGeneralAI(token, { question });
    },
  });
}
