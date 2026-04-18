import type { Request, Response } from "express";
import { getSupabaseAuth } from "../lib/supabase-auth";

export class HealthController {
  static async check(req: Request, res: Response) {
    try {
      const supabase = getSupabaseAuth();
      const { error } = await supabase.from("academic_years").select("id").limit(1);
      if (error) throw error;
      return res.status(200).json({ status: "ok" });
    } catch (error: any) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }
}
