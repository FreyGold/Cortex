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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doctor } from "@/lib/data/catalog";

type Props = {
  courseId: string;
  doctors: Doctor[];
};

export function ResourceDialog({ courseId, doctors }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const google_drive_url = formData.get("google_drive_url") as string;
    
    // Extract ID from URL if user pastes full URL
    let google_drive_id = formData.get("google_drive_id") as string;
    if (google_drive_id && google_drive_id.includes("drive.google.com")) {
      const match = google_drive_id.match(/[-\w]{25,}/);
      if (match) {
        google_drive_id = match[0];
      }
    }

    const payload = {
      title_en: formData.get("title_en"),
      type: formData.get("type"),
      exam_type: formData.get("exam_type") || null,
      doctor_id: formData.get("doctor_id") || null,
      google_drive_id,
      google_drive_url: google_drive_url || null,
      description: formData.get("description") || null,
    };

    try {
      const res = await fetch(`/api/data/courses/${courseId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
              <Label htmlFor="title_en">Title (English) *</Label>
              <Input id="title_en" name="title_en" required placeholder="e.g. Midterm 2023" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Resource Type *</Label>
              <Select name="type" required>
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
            <div className="grid gap-2">
              <Label htmlFor="exam_type">Exam Type (if Exam)</Label>
              <Select name="exam_type">
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">Midterm</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doctor_id">Instructor</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="google_drive_id">Google Drive ID *</Label>
              <Input id="google_drive_id" name="google_drive_id" required placeholder="File ID or Full URL" />
              <p className="text-[10px] text-muted-foreground">The ID from the drive.google.com URL.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="google_drive_url">Google Drive URL</Label>
              <Input id="google_drive_url" name="google_drive_url" placeholder="Full URL (e.g., for folders)" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Optional details..." />
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