import { Router } from "express";
import { getSupabaseAuth } from "../lib/supabase-auth";

type AuthBody = {
  email?: string;
  password?: string;
  fullName?: string;
};

function validateEmailPassword(body: AuthBody) {
  if (!body.email || !body.password) {
    return "Email and password are required.";
  }

  if (body.password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return null;
}

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  let supabaseAuth;
  try {
    supabaseAuth = getSupabaseAuth();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }

  const body = req.body as AuthBody;
  const validationError = validateEmailPassword(body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { data, error } = await supabaseAuth.auth.signUp({
    email: body.email as string,
    password: body.password as string,
    options: {
      data: body.fullName ? { full_name: body.fullName } : undefined,
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({
    user: data.user,
    session: data.session,
    message: data.session
      ? "Signed up successfully."
      : "Signup succeeded. Check your email to confirm your account.",
  });
});

authRouter.post("/login", async (req, res) => {
  let supabaseAuth;
  try {
    supabaseAuth = getSupabaseAuth();
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }

  const body = req.body as AuthBody;
  const validationError = validateEmailPassword(body);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: body.email as string,
    password: body.password as string,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  return res.status(200).json({
    user: data.user,
    session: data.session,
    message: "Signed in successfully.",
  });
});
