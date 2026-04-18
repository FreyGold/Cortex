import type { Request, Response } from "express";
import { NoteService } from "../services/NoteService";
import { NoteRepository } from "../repositories/NoteRepository";
import { getSupabaseUserClient } from "../lib/supabase-admin";

function getService(req: Request) {
  const accessToken = req.user!.accessToken!;
  const supabase = getSupabaseUserClient(accessToken);
  const repo = new NoteRepository(supabase);
  return new NoteService(repo);
}

export class NoteController {
  static async getDashboard(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.getDashboard(req.user!.id);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getNoteDetail(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.getNoteDetail(req.user!.id, req.params.id as string);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(error.message === "Note not found." ? 404 : 500).json({ error: error.message });
    }
  }

  static async createNote(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { title, folderId } = req.body;
      const data = await service.createNote(req.user!.id, title || "Untitled note", folderId ?? null);
      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateNote(req: Request, res: Response) {
    try {
      const service = getService(req);
      const input = req.body;
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (typeof input.title === "string") {
        updatePayload.title = input.title;
      }
      if (typeof input.html === "string") {
        updatePayload.content = { html: input.html };
        updatePayload.content_text = input.html
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        updatePayload.word_count = updatePayload.content_text
          ? String(updatePayload.content_text).split(/\s+/).filter(Boolean).length
          : 0;
      }
      if (input.folderId !== undefined) {
        updatePayload.folder_id = input.folderId;
      }

      await service.updateNote(req.user!.id, req.params.id as string, updatePayload);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createFolder(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Folder name required" });
      await service.createFolder(req.user!.id, name.trim());
      return res.status(201).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateFolder(req: Request, res: Response) {
    try {
      const service = getService(req);
      const updatePayload: Record<string, unknown> = {};
      if (req.body.name !== undefined) updatePayload.name = req.body.name;
      if (req.body.parentId !== undefined) updatePayload.parent_id = req.body.parentId;
      if (req.body.color !== undefined) updatePayload.color = req.body.color;

      await service.updateFolder(req.user!.id, req.params.id as string, updatePayload);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createTag(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Tag name required" });
      await service.createTag(req.user!.id, name.trim());
      return res.status(201).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateNoteTags(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { tagIds } = req.body;
      if (!Array.isArray(tagIds)) return res.status(400).json({ error: "tagIds must be an array" });
      await service.updateNoteTags(req.params.id as string, tagIds);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getNoteShares(req: Request, res: Response) {
    try {
      const service = getService(req);
      const data = await service.getNoteShares(req.params.id as string);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async createNoteShare(req: Request, res: Response) {
    try {
      const service = getService(req);
      const { mode, sharedWithUserId, canEdit, expiresAt } = req.body;
      const noteId = req.params.id;

      const payload: Record<string, unknown> = {
        note_id: noteId,
        can_edit: Boolean(canEdit),
        expires_at: expiresAt ?? null,
      };

      if (mode === "user") {
        if (!sharedWithUserId?.trim()) {
          return res.status(400).json({ error: "Recipient user ID is required." });
        }
        payload.shared_with_user_id = sharedWithUserId.trim();
      } else {
        payload.share_token = crypto.randomUUID().replace(/-/g, "");
      }

      const data = await service.createNoteShare(payload);
      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteNoteShare(req: Request, res: Response) {
    try {
      const service = getService(req);
      await service.deleteNoteShare(req.params.id as string, req.params.shareId as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
