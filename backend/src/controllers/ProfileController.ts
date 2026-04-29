import type { Request, Response } from "express";
import { ProfileService } from "../services/ProfileService";
import { ProfileRepository } from "../repositories/ProfileRepository";
import { getSupabaseUserClient } from "../lib/supabase-admin";

function getService(req: Request) {
  const accessToken = req.user!.accessToken!;
  const supabase = getSupabaseUserClient(accessToken);
  const repo = new ProfileRepository(supabase);
  return new ProfileService(repo);
}

export class ProfileController {
  static async getMe(req: Request, res: Response) {
    try {
      const service = getService(req);
      const profile = await service.getMe(req.user!.id);
      return res.status(200).json({ profile });
    } catch (error: any) {
      return res.status(error.message.includes("not found") ? 404 : 500).json({ error: error.message });
    }
  }

  static async setup(req: Request, res: Response) {
    try {
      const service = getService(req);
      await service.setupProfile(req.user!.id, req.body);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async updateAI(req: Request, res: Response) {
    try {
      const service = getService(req);
      await service.updateAISettings(req.user!.id, req.body);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async requestVerification(req: Request, res: Response) {
    try {
      const service = getService(req);
      const profile = await service.requestVerification(req.user!.id);
      return res.status(200).json({ profile });
    } catch (error: any) {
      const status = error.message.includes("already") ? 409 : (error.message.includes("not found") ? 404 : 500);
      return res.status(status).json({ error: error.message });
    }
  }
}
