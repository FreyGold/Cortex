import type { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { AuthRepository } from "../repositories/AuthRepository";
import { getSupabaseAuth } from "../lib/supabase-auth";

function getService() {
  const supabase = getSupabaseAuth();
  const repo = new AuthRepository(supabase);
  return new AuthService(repo);
}

function validateEmailPassword(body: any) {
  if (!body.email || !body.password) return "Email and password are required.";
  if (body.password.length < 6) return "Password must be at least 6 characters.";
  return null;
}

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const error = validateEmailPassword(req.body);
      if (error) return res.status(400).json({ error });

      const service = getService();
      const result = await service.signUp(req.body.email, req.body.password, req.body.fullName);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const error = validateEmailPassword(req.body);
      if (error) return res.status(400).json({ error });

      const service = getService();
      const result = await service.login(req.body.email, req.body.password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }
}
