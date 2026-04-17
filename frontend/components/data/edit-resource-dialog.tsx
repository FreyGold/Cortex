"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSimple, Trash } from "@phosphor-icons/react/dist/ssr";
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
import type { Doctor, Resource } from "@/lib/data/catalog";

type Props = {
  resource: Resource;
  doctors: Doctor[];
};

export function EditResourceDialog({ resource, doctors }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const google_drive_url = formData.get("google_drive_url") as string;
    
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
      const res = await fetch(`/api/data/resources/${resource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update resource");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/data/resources/${resource.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete resource");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <PencilSimple className="size-4 text-muted-foreground hover:text-primary transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update resource details or delete it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid gap-2">
              <Label htmlFor="title_en">Title (English) *</Label>
              <Input id="title_en" name="title_en" required defaultValue={resource.title_en} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Resource Type *</Label>
              <Select name="type" required defaultValue={resource.type}>
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
              <Select name="exam_type" defaultValue={resource.exam_type || undefined}>
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
              <Select name="doctor_id" defaultValue={resource.doctor_id || undefined}>
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
              <Input id="google_drive_id" name="google_drive_id" required defaultValue={resource.google_drive_id} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="google_drive_url">Google Drive URL</Label>
              <Input id="google_drive_url" name="google_drive_url" defaultValue={resource.google_drive_url || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={resource.description || ""} />
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isDeleting}>
              <Trash className="size-4 mr-2" />
              Delete
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}