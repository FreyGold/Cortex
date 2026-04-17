import type { NextFunction, Request, Response } from "express";
import { getSupabaseAuth } from "../lib/supabase-auth";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  let supabaseAuth;
  try {
    supabaseAuth = getSupabaseAuth();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = {
    id: data.user.id,
    email: data.user.email ?? null,
    accessToken: token,
  };

  return next();
}
