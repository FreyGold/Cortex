import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getSupabaseUserClient } from "../lib/supabase-admin";

export const profileRouter = Router();

profileRouter.use(authMiddleware);

profileRouter.get("/me", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  const accessToken = req.user?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  const supabase = getSupabaseUserClient(accessToken);
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,name,role,is_verified,verified_at,verification_requested_at,preferred_language",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return res
      .status(500)
      .json({ error: `Failed to load profile: ${error.message}` });
  }

  if (!data) {
    return res.status(404).json({ error: "User profile not found." });
  }

  return res.status(200).json({ profile: data });
});

async function handleVerificationRequest(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  const accessToken = req.user?.accessToken;
  if (!accessToken) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  const supabase = getSupabaseUserClient(accessToken);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,is_verified,verification_requested_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return res
      .status(500)
      .json({ error: `Failed to load profile: ${profileError.message}` });
  }
  if (!profile) {
    return res.status(404).json({ error: "User profile not found." });
  }
  if (profile.is_verified) {
    return res.status(409).json({ error: "Profile is already verified." });
  }
  if (profile.verification_requested_at) {
    return res
      .status(409)
      .json({ error: "Verification has already been requested." });
  }

  const nowIso = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ verification_requested_at: nowIso })
    .eq("id", userId)
    .eq("is_verified", false)
    .is("verification_requested_at", null)
    .select(
      "id,name,role,is_verified,verified_at,verification_requested_at,preferred_language",
    )
    .maybeSingle();

  if (updateError) {
    return res
      .status(500)
      .json({ error: `Failed to request verification: ${updateError.message}` });
  }

  if (!updated) {
    return res.status(409).json({
      error: "Verification request could not be applied. Please retry.",
    });
  }

  return res.status(200).json({ profile: updated });
}

profileRouter.post("/request-verification", handleVerificationRequest);
profileRouter.patch("/request-verification", handleVerificationRequest);
