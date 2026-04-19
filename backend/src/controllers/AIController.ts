import type { Request, Response } from "express";
import { AIService } from "../services/AIService";
import { AIRepository } from "../repositories/AIRepository";
import { getSupabaseUserClient } from "../lib/supabase-admin";
import { isValidUuid } from "../lib/ai-utils";

function getService(req: Request) {
  const supabase = getSupabaseUserClient(req.user!.accessToken!);
  const repo = new AIRepository(supabase);
  return new AIService(repo);
}

export class AIController {
  static async embedNote(req: Request, res: Response) {
    try {
      const noteId = req.params.id as string;
      if (!isValidUuid(noteId)) return res.status(400).json({ error: "Invalid note ID." });
      const service = getService(req);
      const result = await service.embedNote(noteId, req.user!.id);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const { query, threshold = 0.5, limit = 10 } = req.body;
      if (!query || query.trim().length < 2) return res.status(400).json({ error: "Query too short." });
      const service = getService(req);
      const matches = await service.searchNotes(req.user!.id, query, threshold, limit);
      return res.status(200).json({ query, threshold, limit, matches });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getConversation(req: Request, res: Response) {
    try {
      const noteId = req.params.id as string;
      if (!isValidUuid(noteId)) return res.status(400).json({ error: "Invalid note ID." });
      const service = getService(req);
      const messages = await service.getConversation(noteId, req.user!.id);
      return res.status(200).json({ messages });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async listGlobalConversations(req: Request, res: Response) {
    try {
      const service = getService(req);
      const noteId = req.query.noteId as string | undefined;
      const result = await service.listGlobalConversations(req.user!.id, noteId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async clearGlobalConversation(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const service = getService(req);
      await service.clearGlobalConversation(id);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async archiveGlobalConversation(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const service = getService(req);
      await service.archiveGlobalConversation(id);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getGlobalConversation(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const service = getService(req);
      const data = await service.getSpecificGlobalConversation(id);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async askNote(req: Request, res: Response) {
    try {
      const noteId = req.params.id as string;
      const { question, messages, topK = 10, conversationId } = req.body;
      const currentQuestion = question || messages?.[messages.length - 1]?.content;
      if (!currentQuestion) return res.status(400).json({ error: "No question provided." });

      const service = getService(req);
      const result = await service.askNote(noteId, req.user!.id, currentQuestion, messages || [], topK, conversationId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async askAllNotes(req: Request, res: Response) {
    try {
      const { question, messages, topK = 15, conversationId } = req.body;
      const currentQuestion = question || messages?.[messages.length - 1]?.content;
      if (!currentQuestion) return res.status(400).json({ error: "No question provided." });

      const service = getService(req);
      const result = await service.askAllNotes(req.user!.id, currentQuestion, messages || [], topK, conversationId, req.body.noteId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async askGeneral(req: Request, res: Response) {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ error: "Question required." });
      const service = getService(req);
      const result = await service.askGeneral(question);
      return res.status(200).json({ question, ...result });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Streaming endpoint to support frontend streaming consumers.
  static async askGeneralStream(req: Request, res: Response) {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ error: "Question required." });
      const service = getService(req);

      // Prepare SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      // Recommended for some proxies to disable buffering
      res.setHeader("X-Accel-Buffering", "no");

      // Ask general (this currently returns the full answer). We'll stream it as incremental deltas.
      const result = await service.askGeneral(question);
      const answer = (result?.answer ?? "").trim();

      if (!answer) {
        const payload = JSON.stringify({ error: "No answer returned", done: true });
        res.write(`data: ${payload}\n\n`);
        return res.end();
      }

      // Break the answer into smaller chunks (attempt to split by sentences, fallback to fixed size)
      const sentences = answer.match(/[^.!?]+[.!?\n]?/g) || [];
      const chunks: string[] = [];
      if (sentences.length > 1) {
        // group sentences into ~200 char chunks
        let acc = "";
        for (const s of sentences) {
          if ((acc + s).length > 240) {
            if (acc) {
              chunks.push(acc);
              acc = s;
            } else {
              chunks.push(s);
              acc = "";
            }
          } else {
            acc += s;
          }
        }
        if (acc) chunks.push(acc);
      } else {
        // fallback: slice into 200-char chunks
        for (let i = 0; i < answer.length; i += 200) {
          chunks.push(answer.slice(i, i + 200));
        }
      }

      // Stream chunks as SSE 'data' events
      for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1;
        const payload = JSON.stringify({ delta: chunks[i], done: isLast });
        res.write(`data: ${payload}\n\n`);
        // flush if available
        try { (res as any).flush?.(); } catch (e) { /* ignore */ }
        // small pause to let client handle chunks (no await to avoid delaying server too long)
        await new Promise((r) => setTimeout(r, 20));
      }

      return res.end();
    } catch (error: any) {
      try {
        const payload = JSON.stringify({ error: error.message ?? "Unknown error" });
        res.write(`data: ${payload}\n\n`);
      } catch (e) {
        // ignore
      }
      return res.end();
    }
  }

  static async summarize(req: Request, res: Response) {
    try {
      const noteId = req.params.id as string;
      if (!isValidUuid(noteId)) return res.status(400).json({ error: "Invalid note ID." });
      const service = getService(req);
      const summary = await service.summarizeNote(noteId, req.user!.id);
      return res.status(200).json({ noteId, summary });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async suggestTags(req: Request, res: Response) {
    try {
      const noteId = req.params.id as string;
      if (!isValidUuid(noteId)) return res.status(400).json({ error: "Invalid note ID." });
      const service = getService(req);
      const tags = await service.suggestTags(noteId, req.user!.id);
      return res.status(200).json({ noteId, tags });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
