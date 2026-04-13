"use client";

import { useState } from "react";
import { CortexButton } from "@/components/ui/cortex-button";
import {
  CortexCard,
  CortexCardContent,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";
import { getBackendUrl } from "@/lib/api/backend-url";
import { createClient } from "@/lib/supabase/client";

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error("You must be signed in to manage data.");
  }
  return session.access_token;
}

async function postAdmin(path: string, body: unknown) {
  const token = await getAccessToken();
  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }
}

export function DataManager() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [universityName, setUniversityName] = useState("");
  const [universitySlug, setUniversitySlug] = useState("");
  const [collegeUniversityId, setCollegeUniversityId] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeSlug, setCollegeSlug] = useState("");

  const submitUniversity = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await postAdmin("/api/admin/universities", {
        name_en: universityName,
        slug: universitySlug,
      });
      setFeedback("University created successfully.");
      setUniversityName("");
      setUniversitySlug("");
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitCollege = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await postAdmin("/api/admin/colleges", {
        university_id: collegeUniversityId,
        name_en: collegeName,
        slug: collegeSlug,
      });
      setFeedback("College created successfully.");
      setCollegeUniversityId("");
      setCollegeName("");
      setCollegeSlug("");
    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <CortexCard>
        <CortexCardHeader>
          <CortexCardTitle>Create university</CortexCardTitle>
        </CortexCardHeader>
        <CortexCardContent className="space-y-3">
          <input
            value={universityName}
            onChange={(event) => setUniversityName(event.target.value)}
            placeholder="University name"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            value={universitySlug}
            onChange={(event) => setUniversitySlug(event.target.value)}
            placeholder="Slug (e.g. cairo-university)"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <CortexButton
            onClick={submitUniversity}
            loading={busy}
            disabled={!universityName || !universitySlug}
          >
            Save university
          </CortexButton>
        </CortexCardContent>
      </CortexCard>

      <CortexCard>
        <CortexCardHeader>
          <CortexCardTitle>Create college</CortexCardTitle>
        </CortexCardHeader>
        <CortexCardContent className="space-y-3">
          <input
            value={collegeUniversityId}
            onChange={(event) => setCollegeUniversityId(event.target.value)}
            placeholder="University ID"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            value={collegeName}
            onChange={(event) => setCollegeName(event.target.value)}
            placeholder="College name"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            value={collegeSlug}
            onChange={(event) => setCollegeSlug(event.target.value)}
            placeholder="Slug (e.g. faculty-of-engineering)"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <CortexButton
            onClick={submitCollege}
            loading={busy}
            disabled={!collegeUniversityId || !collegeName || !collegeSlug}
          >
            Save college
          </CortexButton>
        </CortexCardContent>
      </CortexCard>

      {feedback ? (
        <p className="text-sm text-muted-foreground lg:col-span-2">{feedback}</p>
      ) : null}
    </div>
  );
}
