import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ProfileSetupBody = {
  universityId?: string | null;
  collegeId?: string | null;
  majorId?: string | null;
  yearLevelId?: string | null;
  preferredLanguage?: "en" | "ar";
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
  }

  const body = (await request.json()) as ProfileSetupBody;

  if (!body.universityId || !body.collegeId || !body.majorId || !body.yearLevelId) {
    return NextResponse.json(
      { error: "University, college, major, and year level are required." },
      { status: 400 },
    );
  }

  const preferredLanguage =
    body.preferredLanguage === "ar" || body.preferredLanguage === "en"
      ? body.preferredLanguage
      : "en";

  const { error } = await supabase
    .from("profiles")
    .update({
      university_id: body.universityId,
      college_id: body.collegeId,
      major_id: body.majorId,
      year_level_id: body.yearLevelId,
      preferred_language: preferredLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: `Failed to save profile setup: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
