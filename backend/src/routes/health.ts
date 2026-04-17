import { Router } from "express";
import { getSupabaseAuth } from "../lib/supabase-auth";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  let supabaseAuth;
  try {
    supabaseAuth = getSupabaseAuth();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: (error as Error).message,
    });
  }

  const { error } = await supabaseAuth
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
