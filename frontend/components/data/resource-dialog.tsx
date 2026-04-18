"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doctor } from "@/lib/data/catalog";
import { getAccessToken } from "@/lib/supabase/client";
import { getBackendUrl } from "@/lib/api/backend-url";
import { AddDoctorDialog } from "./add-doctor-dialog";

type Props = {
  courseId: string;
  doctors: Doctor[];
};

export function ResourceDialog({ courseId, doctors: initialDoctors }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [resourceType, setResourceType] = useState<string>("lecture");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const google_drive_url = formData.get("google_drive_url") as string;
    
    // Extract ID from URL
    let google_drive_id = "";
    if (google_drive_url && google_drive_url.includes("drive.google.com")) {
      const match = google_drive_url.match(/[-\w]{25,}/);
      if (match) {
        google_drive_id = match[0];
      }
    }

    if (!google_drive_id) {
      alert("Invalid Google Drive URL. Please paste a valid link to extract the file ID.");
      setIsLoading(false);
      return;
    }

    const payload = {
      title_en: formData.get("title_en"),
      type: resourceType,
      exam_type: resourceType === "exam" ? formData.get("exam_type") : null,
      doctor_id: formData.get("doctor_id") || null,
      google_drive_id,
      google_drive_url: google_drive_url || null,
    };

    try {
      const token = await getAccessToken();

      const res = await fetch(`${getBackendUrl()}/api/data/courses/${courseId}/resources`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create resource");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 mt-4" variant="outline">
          <Plus className="size-4" />
          Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Upload a new file or folder link to this course.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid gap-2">
              <Label htmlFor="title_en">Title *</Label>
              <Input id="title_en" name="title_en" required placeholder="e.g. Midterm 2023" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Resource Type *</Label>
              <Select name="type" required value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resourceType === "exam" && (
              <div className="grid gap-2">
                <Label htmlFor="exam_type">Exam Type *</Label>
                <Select name="exam_type" required={resourceType === "exam"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="doctor_id">Instructor</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select name="doctor_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <AddDoctorDialog onSuccess={(newDoc) => setDoctors([...doctors, newDoc])} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="google_drive_url">Google Drive URL *</Label>
              <Input id="google_drive_url" name="google_drive_url" required placeholder="Paste full Google Drive link" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
