import type { Request, Response } from "express";
import { AdminService } from "../services/AdminService";
import { AdminRepository } from "../repositories/AdminRepository";
import { getSupabaseUserClient, getSupabaseAdmin } from "../lib/supabase-admin";

function getAdminService() {
  const supabase = getSupabaseAdmin();
  const repo = new AdminRepository(supabase);
  return new AdminService(repo);
}

export class AdminController {
  static async getUsers(req: Request, res: Response) {
    try {
      const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
      const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 25;
      const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? Math.trunc(limitRaw) : 25));

      const service = getAdminService();
      const users = await service.getUsers(query, limit);
      return res.status(200).json({ users });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async verifyUser(req: Request, res: Response) {
    try {
      const { userId, isVerified } = req.body;
      if (!userId || typeof isVerified !== "boolean") {
        return res.status(400).json({ error: "userId and isVerified (boolean) are required." });
      }
      const service = getAdminService();
      const data = await service.verifyUser(userId, isVerified, req.user!.id);
      return res.status(200).json({ profile: data });
    } catch (error: any) {
      return res.status(error.message.includes("not found") ? 404 : 500).json({ error: error.message });
    }
  }

  static async createUniversity(req: Request, res: Response) {
    try {
      const service = getAdminService();
      const data = await service.createUniversity(req.body);
      return res.status(201).json({ university: data });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async createCollege(req: Request, res: Response) {
    try {
      const service = getAdminService();
      const data = await service.createCollege(req.body);
      return res.status(201).json({ college: data });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async createMajor(req: Request, res: Response) {
    try {
      const service = getAdminService();
      const data = await service.createMajor(req.body);
      return res.status(201).json({ major: data });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async createCourse(req: Request, res: Response) {
    try {
      const service = getAdminService();
      const data = await service.createCourse(req.body);
      return res.status(201).json({ course: data });
    } catch (error: any) {
      return res.status(error.message.includes("required") ? 400 : 500).json({ error: error.message });
    }
  }

  static async seed(req: Request, res: Response) {
    const providedToken = req.header("x-seed-token");
    const expectedToken = process.env.ADMIN_SEED_TOKEN;
    if (!expectedToken) return res.status(500).json({ error: "ADMIN_SEED_TOKEN not configured." });
    if (!providedToken || providedToken !== expectedToken) return res.status(403).json({ error: "Invalid token." });

    try {
      const service = getAdminService();
      const count = await service.seedData();
      return res.status(200).json({ seeded: true, yearLevels: count });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
