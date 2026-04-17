import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { verifiedMiddleware } from "../middleware/verifiedMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { getSupabaseUserClient } from "../lib/supabase-admin";

export const dataRouter = Router();

dataRouter.post("/courses", authMiddleware, verifiedMiddleware, async (req, res) => {
  const {
    major_id,
    year_level_id,
    name_en,
    name_ar,
    code,
    description,
    credits,
  } = req.body;

  if (!major_id || !name_en) {
    return res.status(400).json({ error: "major_id and name_en are required." });
  }

  const supabase = getSupabaseUserClient(req.user!.accessToken!);
  const { data, error } = await supabase
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
    return res.status(500).json({ error: `Failed to create course: ${error.message}` });
  }

  return res.status(201).json({ course: data });
});

dataRouter.put("/courses/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const supabase = getSupabaseUserClient(req.user!.accessToken!);
  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: `Failed to update course: ${error.message}` });
  }

  return res.status(200).json({ course: data });
});

dataRouter.post("/courses/:courseId/resources", authMiddleware, verifiedMiddleware, async (req, res) => {
  const { courseId } = req.params;
  const {
    academic_year_id,
    doctor_id,
    title_en,
    title_ar,
    description,
    type,
    exam_type,
    lecture_number,
    google_drive_id,
    google_drive_url,
    google_drive_embed_url,
    file_name,
    file_type,
    file_size,
  } = req.body;

  if (!title_en || !type || !google_drive_id) {
    return res.status(400).json({ error: "title_en, type, and google_drive_id are required." });
  }

  const supabase = getSupabaseUserClient(req.user!.accessToken!);
  const { data, error } = await supabase
    .from("resources")
    .insert({
      course_id: courseId,
      academic_year_id: academic_year_id ?? null,
      doctor_id: doctor_id ?? null,
      uploaded_by: req.user!.id,
      title_en: title_en.trim(),
      title_ar: title_ar?.trim() || null,
      description: description?.trim() || null,
      type,
      exam_type: exam_type || null,
      lecture_number: lecture_number || null,
      google_drive_id,
      google_drive_url: google_drive_url || null,
      google_drive_embed_url: google_drive_embed_url || null,
      file_name: file_name || null,
      file_type: file_type || null,
      file_size: file_size || null,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: `Failed to create resource: ${error.message}` });
  }

  return res.status(201).json({ resource: data });
});

dataRouter.put("/resources/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const supabase = getSupabaseUserClient(req.user!.accessToken!);
  const { data, error } = await supabase
    .from("resources")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: `Failed to update resource: ${error.message}` });
  }

  return res.status(200).json({ resource: data });
});

dataRouter.delete("/resources/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;

  const supabase = getSupabaseUserClient(req.user!.accessToken!);
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ error: `Failed to delete resource: ${error.message}` });
  }

  return res.status(204).send();
});
