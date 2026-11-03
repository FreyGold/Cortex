import type { Request, Response } from "express";
import { getSupabaseAnonClient } from "../lib/supabase-admin";

export class HealthController {
  static async check(req: Request, res: Response) {
    try {
      const dataClient = getSupabaseAnonClient();
      const { error } = await dataClient.from("academic_years").select("id").limit(1);
      if (error) throw error;
      return res.status(200).json({ status: "ok" });
    } catch (error: any) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }
}
