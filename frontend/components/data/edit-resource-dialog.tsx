"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import type { Doctor, Resource } from "@/lib/data/catalog";
import { getAccessToken } from "@/lib/supabase/client";
import { getBackendUrl } from "@/lib/api/backend-url";
import { AddDoctorDialog } from "./add-doctor-dialog";

type Props = {
  resource: Resource;
  doctors: Doctor[];
};

export function EditResourceDialog({ resource, doctors: initialDoctors }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [resourceType, setResourceType] = useState<string>(resource.type);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const google_drive_url = formData.get("google_drive_url") as string;
    
    // Extract ID from URL if provided, otherwise keep existing
    let google_drive_id = resource.google_drive_id;
    if (google_drive_url && google_drive_url.includes("drive.google.com")) {
      const match = google_drive_url.match(/[-\w]{25,}/);
      if (match) {
        google_drive_id = match[0];
      }
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
      const res = await fetch(`${getBackendUrl()}/api/data/resources/${resource.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
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
      const token = await getAccessToken();

      const res = await fetch(`${getBackendUrl()}/api/data/resources/${resource.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
          <Pencil className="size-4 text-muted-foreground hover:text-primary transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update resource metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid gap-2">
              <Label htmlFor="title_en">Title *</Label>
              <Input id="title_en" name="title_en" required defaultValue={resource.title_en} />
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
                <Select name="exam_type" defaultValue={resource.exam_type || undefined} required={resourceType === "exam"}>
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
                <AddDoctorDialog onSuccess={(newDoc) => setDoctors([...doctors, newDoc])} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="google_drive_url">Google Drive URL</Label>
              <Input id="google_drive_url" name="google_drive_url" defaultValue={resource.google_drive_url || ""} placeholder="Link to file or folder" />
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button type="button" variant="destructive" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="size-4 mr-2" />
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
