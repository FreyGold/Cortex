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
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

import { useNotesDashboard } from "@/hooks/use-notes";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Sparkles } from "lucide-react";

type Props = {
  resource: Resource;
  doctors: Doctor[];
  triggerClassName?: string;
};

export function EditResourceDialog({ resource, doctors: initialDoctors, triggerClassName }: Props) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [resourceType, setResourceType] = useState<string>(resource.type);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(resource.note_id || "");
  const [notePickerOpen, setNotePickerOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(resource.doctor_id || "");
  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);
  const router = useRouter();

  const notesQuery = useNotesDashboard();
  const userNotes = notesQuery.data?.notes || [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const google_drive_url = formData.get("google_drive_url") as string;
    
    // Extract ID from URL for non-note types if URL is provided
    let google_drive_id = resource.google_drive_id;
    if (resourceType !== "note" && google_drive_url) {
        if (google_drive_url.includes("drive.google.com")) {
            const match = google_drive_url.match(/[-\w]{25,}/);
            if (match) {
                google_drive_id = match[0];
            }
        }
    }

    const payload = {
      title_en: formData.get("title_en"),
      type: resourceType,
      exam_type: resourceType === "exam" ? formData.get("exam_type") : null,
      doctor_id: selectedDoctorId || null,
      google_drive_id: resourceType === "note" ? null : google_drive_id,
      google_drive_url: resourceType === "note" ? null : (google_drive_url || null),
      note_id: resourceType === "note" ? selectedNoteId : null,
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
        <Button variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full", triggerClassName)}>
          <Pencil className="size-4 text-muted-foreground hover:text-primary transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-border/10 p-0 overflow-hidden shadow-2xl">
        <form onSubmit={onSubmit}>
          <div className="p-8 space-y-6">
            <header className="space-y-1">
                <DialogTitle className="text-2xl font-bold tracking-tight">Edit Resource</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                Update course material metadata.
                </DialogDescription>
            </header>

            <div className="grid gap-5">
                <div className="grid gap-2">
                <Label htmlFor="title_en" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Title *</Label>
                <Input id="title_en" name="title_en" required defaultValue={resource.title_en} className="rounded-xl h-11 border-border/40 focus:ring-primary/20" />
                </div>
                
                <div className="grid gap-2">
                <Label htmlFor="type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Resource Type *</Label>
                <Select name="type" required value={resourceType} onValueChange={setResourceType}>
                    <SelectTrigger className="rounded-xl h-11 border-border/40">
                    <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/10 shadow-2xl">
                    <SelectItem value="lecture">Lecture</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="note">Note (from library)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                {resourceType === "exam" && (
                <div className="grid gap-2">
                    <Label htmlFor="exam_type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Exam Type *</Label>
                    <Select name="exam_type" defaultValue={resource.exam_type || undefined} required={resourceType === "exam"}>
                    <SelectTrigger className="rounded-xl h-11 border-border/40">
                        <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/10 shadow-2xl">
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                )}

                {resourceType === "note" && (
                <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Select Note *</Label>
                    <Popover open={notePickerOpen} onOpenChange={setNotePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={notePickerOpen}
                                className="w-full justify-between rounded-xl h-11 border-border/40 font-normal hover:bg-muted/10 transition-all"
                            >
                                {selectedNoteId
                                    ? userNotes.find((n) => n.id === selectedNoteId)?.title || "Untitled"
                                    : "Select from your library..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[380px] p-0 rounded-2xl border-border/10 shadow-2xl">
                            <Command>
                                <CommandInput placeholder="Search your notes..." className="h-10" />
                                <CommandList className="max-h-[300px]">
                                    <CommandEmpty className="py-6 text-sm text-center italic text-muted-foreground">No notes found.</CommandEmpty>
                                    <CommandGroup heading="Your Library">
                                        {userNotes.map((note) => (
                                            <CommandItem
                                                key={note.id}
                                                value={note.title}
                                                onSelect={() => {
                                                    setSelectedNoteId(note.id);
                                                    setNotePickerOpen(false);
                                                }}
                                                className="py-3 px-4 flex items-center gap-3 cursor-pointer"
                                            >
                                                <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                                                    <Sparkles className="size-4" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-semibold truncate">{note.title || "Untitled"}</span>
                                                    <span className="text-[10px] text-muted-foreground opacity-60">Updated {new Date(note.updated_at).toLocaleDateString()}</span>
                                                </div>
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4 text-primary",
                                                        selectedNoteId === note.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                )}

                <div className="grid gap-2">
                <Label htmlFor="doctor_id" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Instructor</Label>
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                    <Popover open={doctorPickerOpen} onOpenChange={setDoctorPickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={doctorPickerOpen}
                                className="w-full justify-between rounded-xl h-11 border-border/40 font-normal hover:bg-muted/10 transition-all"
                            >
                                {selectedDoctorId
                                    ? doctors.find((d) => d.id === selectedDoctorId)?.name_en || "Unknown"
                                    : "Select instructor (optional)"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[380px] p-0 rounded-2xl border-border/10 shadow-2xl">
                            <Command>
                                <CommandInput placeholder="Search instructors..." className="h-10" />
                                <CommandList className="max-h-[300px]">
                                    <CommandEmpty className="py-6 text-sm text-center italic text-muted-foreground">No instructors found.</CommandEmpty>
                                    <CommandGroup heading="Instructors">
                                        <CommandItem
                                            value="none"
                                            onSelect={() => {
                                                setSelectedDoctorId("");
                                                setDoctorPickerOpen(false);
                                            }}
                                            className="py-3 px-4 flex items-center gap-3 cursor-pointer"
                                        >
                                            <span className="font-semibold truncate">No Instructor (Clear)</span>
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4 text-primary",
                                                    !selectedDoctorId ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                        {doctors.map((doc) => (
                                            <CommandItem
                                                key={doc.id}
                                                value={doc.name_en}
                                                onSelect={() => {
                                                    setSelectedDoctorId(doc.id);
                                                    setDoctorPickerOpen(false);
                                                }}
                                                className="py-3 px-4 flex items-center gap-3 cursor-pointer"
                                            >
                                                <span className="font-semibold truncate">{doc.name_en}</span>
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4 text-primary",
                                                        selectedDoctorId === doc.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    </div>
                    <AddDoctorDialog onSuccess={(newDoc) => setDoctors([...doctors, newDoc])} />
                </div>
                </div>

                {resourceType !== "note" && (
                    <div className="grid gap-2">
                    <Label htmlFor="google_drive_url" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">Google Drive URL</Label>
                    <Input id="google_drive_url" name="google_drive_url" defaultValue={resource.google_drive_url || ""} placeholder="Link to file or folder" className="rounded-xl h-11 border-border/40 focus:ring-primary/20" />
                    </div>
                )}
            </div>
          </div>
          <DialogFooter className="bg-muted/10 p-6 pt-4 border-t border-border/5 flex items-center justify-between sm:justify-between">
            <Button type="button" variant="ghost" onClick={onDelete} disabled={isDeleting} className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="size-4 mr-2" />
              Delete Material
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
