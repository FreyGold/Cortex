"use client";

import {
  ArrowRight,
  Buildings,
  CheckCircle,
  GraduationCap,
} from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBackendUrl } from "@/lib/api/backend-url";
import { createClient } from "@/lib/supabase/client";
import { getCatalogData } from "@/lib/data/catalog";

type University = {
  id: string;
  name_en: string;
  slug: string;
};

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to manage data.");
  }

  return session.access_token;
}

async function postAdmin<T>(path: string, body: unknown): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return payload;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function DataManager() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [universityName, setUniversityName] = useState("");
  const [universitySlug, setUniversitySlug] = useState("");
  const [universitySlugTouched, setUniversitySlugTouched] = useState(false);
  const [collegeUniversityId, setCollegeUniversityId] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [collegeSlug, setCollegeSlug] = useState("");
  const [collegeSlugTouched, setCollegeSlugTouched] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [universitiesError, setUniversitiesError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function loadUniversities() {
      setUniversitiesLoading(true);
      setUniversitiesError(null);

      try {
        const data = await getCatalogData();
        if (active) {
          setUniversities(data.universities);
        }
      } catch (error: any) {
        if (active) {
          setUniversitiesError(error.message || "Failed to load universities");
          setUniversities([]);
        }
      } finally {
        if (active) {
          setUniversitiesLoading(false);
        }
      }
    }

    loadUniversities();

    return () => {
      active = false;
    };
  }, []);

  const submitUniversity = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await postAdmin<{ university: University }>(
        "/api/admin/universities",
        {
          name_en: universityName,
          slug: universitySlug,
        },
      );
      setUniversities((current) => [result.university, ...current]);
      setCollegeUniversityId(result.university.id);
      setFeedback({
        message: "University created successfully.",
        type: "success",
      });
      setUniversityName("");
      setUniversitySlug("");
      setUniversitySlugTouched(false);
    } catch (error) {
      setFeedback({ message: (error as Error).message, type: "error" });
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
      setFeedback({
        message: "College created successfully.",
        type: "success",
      });
      setCollegeName("");
      setCollegeSlug("");
      setCollegeSlugTouched(false);
    } catch (error) {
      setFeedback({ message: (error as Error).message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-none border-border/60">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Buildings className="size-5" weight="duotone" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Institution
            </span>
          </div>
          <CardTitle className="text-xl font-bold">Create university</CardTitle>
          <CardDescription>
            Add a new top-level university entity to the catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uni-name">University Name</Label>
            <Input
              id="uni-name"
              value={universityName}
              onChange={(event) => {
                const value = event.target.value;
                setUniversityName(value);
                if (!universitySlugTouched) {
                  setUniversitySlug(slugify(value));
                }
              }}
              placeholder="e.g. Cairo University"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uni-slug">Slug Identifier</Label>
            <Input
              id="uni-slug"
              value={universitySlug}
              onChange={(event) => {
                setUniversitySlugTouched(true);
                setUniversitySlug(event.target.value);
              }}
              placeholder="e.g. cairo-university"
              className="font-mono text-xs"
            />
          </div>
          <Button
            className="w-full gap-2"
            onClick={submitUniversity}
            disabled={busy || !universityName || !universitySlug}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Save University
            <ArrowRight className="size-3.5" />
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border/60">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <GraduationCap className="size-5" weight="duotone" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Faculty
            </span>
          </div>
          <CardTitle className="text-xl font-bold">Create college</CardTitle>
          <CardDescription>
            Map a faculty or college to an existing university.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="col-uni-id">University</Label>
            <Select
              value={collegeUniversityId}
              onValueChange={setCollegeUniversityId}
              disabled={universitiesLoading || universities.length === 0}
            >
              <SelectTrigger id="col-uni-id" className="h-10">
                <SelectValue
                  placeholder={
                    universitiesLoading
                      ? "Loading universities..."
                      : "Select a university"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {universities.map((university) => (
                  <SelectItem key={university.id} value={university.id}>
                    {university.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {universitiesError ? (
              <p className="text-xs text-destructive">{universitiesError}</p>
            ) : !universitiesLoading && universities.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Create a university first, then add colleges under it.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-name">College Name</Label>
            <Input
              id="col-name"
              value={collegeName}
              onChange={(event) => {
                const value = event.target.value;
                setCollegeName(value);
                if (!collegeSlugTouched) {
                  setCollegeSlug(slugify(value));
                }
              }}
              placeholder="e.g. Faculty of Engineering"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="col-slug">Slug Identifier</Label>
            <Input
              id="col-slug"
              value={collegeSlug}
              onChange={(event) => {
                setCollegeSlugTouched(true);
                setCollegeSlug(event.target.value);
              }}
              placeholder="e.g. faculty-of-engineering"
              className="font-mono text-xs"
            />
          </div>
          <Button
            className="w-full gap-2"
            onClick={submitCollege}
            disabled={
              busy || !collegeUniversityId || !collegeName || !collegeSlug
            }
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Save College
            <ArrowRight className="size-3.5" />
          </Button>
        </CardContent>
      </Card>

      {feedback ? (
        <div
          className={`lg:col-span-2 flex items-center gap-2 rounded-lg border p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/20 bg-destructive/5 text-destructive"
          }`}
        >
          {feedback.type === "success" && <CheckCircle className="size-4" />}
          {feedback.message}
        </div>
      ) : null}
    </div>
  );
}
