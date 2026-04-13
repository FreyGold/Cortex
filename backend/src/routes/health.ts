import { Router } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: (error as Error).message,
    });
  }

  const { error } = await supabaseAdmin
    .from("academic_years")
    .select("id")
    .limit(1);

  if (error) {
    return res.status(500).json({
      status: "error",
      message: `Supabase connection failed: ${error.message}`,
    });
  }

  return res.status(200).json({ status: "ok" });
});
