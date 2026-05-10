"use client";

import { User, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBackendUrl } from "@/lib/api/backend-url";
import type { Doctor } from "@/lib/data/catalog";
import { getAccessToken } from "@/lib/supabase/client";
import { AddDoctorDialog } from "./add-doctor-dialog";

type Props = {
  courseId: string;
  allDoctors: Doctor[];
  assignedDoctors: Doctor[];
};

export function ManageCourseDoctorsDialog({
  courseId,
  allDoctors,
  assignedDoctors,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const router = useRouter();

  const unassignedDoctors = allDoctors.filter(
    (doc) => !assignedDoctors.some((assigned) => assigned.id === doc.id),
  );

  async function onAssign() {
    if (!selectedDoctorId) return;
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(
        `${getBackendUrl()}/api/data/courses/${courseId}/doctors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ doctorId: selectedDoctorId }),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to assign instructor");
      }

      setSelectedDoctorId("");
      router.refresh();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function onUnassign(doctorId: string) {
    if (!confirm("Remove this instructor from the course?")) return;
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(
        `${getBackendUrl()}/api/data/courses/${courseId}/doctors/${doctorId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to remove instructor");
      }

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
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 text-muted-foreground hover:text-foreground"
        >
          <UserPlus className="size-3.5" />
          Manage Instructors
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Course Instructors</DialogTitle>
          <DialogDescription>
            Manage which doctors are teaching this course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
              Currently Assigned
            </h4>
            <div className="flex flex-wrap gap-2">
              {assignedDoctors.length > 0 ? (
                assignedDoctors.map((doc) => (
                  <Badge
                    key={doc.id}
                    variant="secondary"
                    className="pl-2 pr-1 h-7 gap-1 bg-muted/50 border-none group transition-all hover:bg-destructive/10 hover:text-destructive"
                  >
                    <User className="size-3 opacity-40" />
                    {doc.name_en}
                    <button
                      onClick={() => onUnassign(doc.id)}
                      className="p-0.5 rounded-full hover:bg-destructive/20 ml-1 transition-colors"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic px-1">
                  No instructors assigned yet.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-1">
              Assign New Instructor
            </h4>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Select
                  value={selectedDoctorId}
                  onValueChange={setSelectedDoctorId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select doctor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedDoctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <AddDoctorDialog
                onSuccess={(newDoc) => {
                  setSelectedDoctorId(newDoc.id);
                  router.refresh();
                }}
              />
              <Button
                size="sm"
                className="h-9 font-bold"
                onClick={onAssign}
                disabled={isLoading || !selectedDoctorId}
              >
                Assign
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
