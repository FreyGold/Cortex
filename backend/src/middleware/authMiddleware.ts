import type { NextFunction, Request, Response } from "express";
import { getSupabaseAuth } from "../lib/supabase-auth";

// Simple in-memory cache for auth results
const userCache = new Map<string, { user: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

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

  // Check cache first
  const cached = userCache.get(token);
  if (cached && cached.expiry > Date.now()) {
    req.user = {
      id: cached.user.id,
      email: cached.user.email ?? null,
      accessToken: token,
    };
    req.authDuration = 0; // Cached
    return next();
  }

  let supabaseAuth;
  try {
    supabaseAuth = getSupabaseAuth();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }

  const authStart = Date.now();
  const { data, error } = await supabaseAuth.auth.getUser(token);
  req.authDuration = Date.now() - authStart;

  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Save to cache
  userCache.set(token, {
    user: data.user,
    expiry: Date.now() + CACHE_TTL,
  });

  req.user = {
    id: data.user.id,
    email: data.user.email ?? null,
    accessToken: token,
  };

  return next();
}
