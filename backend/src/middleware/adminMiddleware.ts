import type { NextFunction, Request, Response } from "express";
import { getSupabaseUserClient } from "../lib/supabase-admin";

export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;
  const accessToken = req.user?.accessToken;
  if (!userId || !accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  const supabase = getSupabaseUserClient(accessToken);
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: `Failed to check user role: ${error.message}` });
  }

  if (!data || data.role !== "admin") {
    return res.status(403).json({ error: "Admin role is required for this action." });
  }

  return next();
}
