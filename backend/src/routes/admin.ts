import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { getSupabaseUserClient } from "../lib/supabase-admin";

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

function getAdminClient(req: { user?: { accessToken?: string } }) {
  const accessToken = req.user?.accessToken;
  if (!accessToken) {
    throw new Error("Unauthorized request.");
  }

  return getSupabaseUserClient(accessToken);
}

adminRouter.get("/users", async (req, res) => {
  const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 25;
  const limit = Math.min(
    100,
    Math.max(1, Number.isFinite(limitRaw) ? Math.trunc(limitRaw) : 25),
  );

  let statement = getAdminClient(req)
    .from("profiles")
    .select(
      "id,name,role,is_verified,verified_at,verification_requested_at,preferred_language,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query) {
    statement = statement.or(`name.ilike.%${query}%`);
  }

  const { data, error } = await statement;
  if (error) {
    return res
      .status(500)
      .json({ error: `Failed to fetch users: ${error.message}` });
  }

  return res.status(200).json({ users: data ?? [] });
});

adminRouter.post("/verify-user", async (req, res) => {
  const { userId, isVerified } = req.body as {
    userId?: string;
    isVerified?: boolean;
  };

  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }
  if (typeof isVerified !== "boolean") {
    return res.status(400).json({ error: "isVerified must be a boolean." });
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await getAdminClient(req)
    .from("profiles")
    .update({
      is_verified: isVerified,
      verified_at: isVerified ? nowIso : null,
      verified_by: isVerified ? req.user?.id : null,
      verification_requested_at: null,
    })
    .eq("id", userId)
    .select("id,is_verified,verified_at,verified_by,verification_requested_at")
    .maybeSingle();

  if (error) {
    return res
      .status(500)
      .json({ error: `Failed to update verification: ${error.message}` });
  }
  if (!data) {
    return res.status(404).json({ error: "User profile not found." });
  }

  return res.status(200).json({ profile: data });
});

adminRouter.post("/universities", async (req, res) => {
  const { name_en, name_ar, slug, country, city, logo_url } = req.body as {
    name_en?: string;
    name_ar?: string;
    slug?: string;
    country?: string;
    city?: string;
    logo_url?: string;
  };

  if (!name_en || !slug) {
    return res.status(400).json({ error: "name_en and slug are required." });
  }

  const { data, error } = await getAdminClient(req)
    .from("universities")
    .insert({
      name_en: name_en.trim(),
      name_ar: name_ar?.trim() || null,
      slug: slug.trim(),
      country: country?.trim() || null,
      city: city?.trim() || null,
      logo_url: logo_url?.trim() || null,
    })
    .select("id,name_en,slug")
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: `Failed to create university: ${error.message}` });
  }

  return res.status(201).json({ university: data });
});

adminRouter.post("/colleges", async (req, res) => {
  const { university_id, name_en, name_ar, slug } = req.body as {
    university_id?: string;
    name_en?: string;
    name_ar?: string;
    slug?: string;
  };

  if (!university_id || !name_en || !slug) {
    return res
      .status(400)
      .json({ error: "university_id, name_en and slug are required." });
  }

  const { data, error } = await getAdminClient(req)
    .from("colleges")
    .insert({
      university_id,
      name_en: name_en.trim(),
      name_ar: name_ar?.trim() || null,
      slug: slug.trim(),
    })
    .select("id,university_id,name_en,slug")
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: `Failed to create college: ${error.message}` });
  }

  return res.status(201).json({ college: data });
});

adminRouter.post("/majors", async (req, res) => {
  const { college_id, name_en, name_ar, slug, icon, color, sort_order } = req.body as {
    college_id?: string;
    name_en?: string;
    name_ar?: string;
    slug?: string;
    icon?: string;
    color?: string;
    sort_order?: number;
  };

  if (!college_id || !name_en || !slug) {
    return res
      .status(400)
      .json({ error: "college_id, name_en and slug are required." });
  }

  const { data, error } = await getAdminClient(req)
    .from("majors")
    .insert({
      college_id,
      name_en: name_en.trim(),
      name_ar: name_ar?.trim() || null,
      slug: slug.trim(),
      icon: icon?.trim() || null,
      color: color?.trim() || null,
      sort_order: typeof sort_order === "number" ? Math.trunc(sort_order) : 0,
    })
    .select("id,college_id,name_en,slug")
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: `Failed to create major: ${error.message}` });
  }

  return res.status(201).json({ major: data });
});

adminRouter.post("/courses", async (req, res) => {
  const {
    major_id,
    year_level_id,
    name_en,
    name_ar,
    code,
    description,
    credits,
  } = req.body as {
    major_id?: string;
    year_level_id?: string | null;
    name_en?: string;
    name_ar?: string;
    code?: string;
    description?: string;
    credits?: number;
  };

  if (!major_id || !name_en) {
    return res.status(400).json({ error: "major_id and name_en are required." });
  }

  const { data, error } = await getAdminClient(req)
    .from("courses")
    .insert({
      major_id,
      year_level_id: year_level_id ?? null,
      name_en: name_en.trim(),
      name_ar: name_ar?.trim() || null,
      code: code?.trim() || null,
      description: description?.trim() || null,
      credits: typeof credits === "number" ? Math.trunc(credits) : null,
    })
    .select("id,major_id,name_en,code")
    .single();

  if (error) {
    return res
      .status(500)
      .json({ error: `Failed to create course: ${error.message}` });
  }

  return res.status(201).json({ course: data });
});

adminRouter.post("/seed", async (req, res) => {
  const providedToken = req.header("x-seed-token");
  const expectedToken = process.env.ADMIN_SEED_TOKEN;
  if (!expectedToken) {
    return res.status(500).json({ error: "ADMIN_SEED_TOKEN is not configured." });
  }
  if (!providedToken || providedToken !== expectedToken) {
    return res.status(403).json({ error: "Invalid seed token." });
  }

  const yearPayload = [
    { level: 1, name_en: "First Year", name_ar: "السنة الأولى" },
    { level: 2, name_en: "Second Year", name_ar: "السنة الثانية" },
    { level: 3, name_en: "Third Year", name_ar: "السنة الثالثة" },
    { level: 4, name_en: "Fourth Year", name_ar: "السنة الرابعة" },
    { level: 5, name_en: "Fifth Year", name_ar: "السنة الخامسة" },
  ];

  const { error } = await getAdminClient(req)
    .from("year_levels")
    .upsert(yearPayload, { onConflict: "level" });

  if (error) {
    return res.status(500).json({ error: `Seed failed: ${error.message}` });
  }

  return res.status(200).json({ seeded: true, yearLevels: yearPayload.length });
});
