import type { NextFunction, Request, Response } from "express";
import { getSupabaseUserClient } from "../lib/supabase-admin";

export async function verifiedMiddleware(
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
    .select("role, is_verified")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: `Failed to check user verification: ${error.message}` });
  }

  if (!data || (data.role !== "admin" && !data.is_verified)) {
    return res.status(403).json({ error: "Verified user status or Admin role is required." });
  }

  return next();
}
