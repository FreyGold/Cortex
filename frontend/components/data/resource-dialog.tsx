"use client";

import { Check, ChevronsUpDown, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotesDashboard } from "@/hooks/use-notes";
import { getBackendUrl } from "@/lib/api/backend-url";
import type { Doctor } from "@/lib/data/catalog";
import { getAccessToken } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { AddDoctorDialog } from "./add-doctor-dialog";

type Props = {
  courseId: string;
  doctors: Doctor[];
  isAdmin?: boolean;
};

export function ResourceDialog({
  courseId,
  doctors: initialDoctors,
  isAdmin = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [resourceType, setResourceType] = useState<string>("lecture");
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [notePickerOpen, setNotePickerOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);
  const router = useRouter();

  const notesQuery = useNotesDashboard();
  const userNotes = notesQuery.data?.notes || [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const google_drive_url = formData.get("google_drive_url") as string;

    // Extract ID from URL for non-note types
    let google_drive_id = "";
    if (resourceType !== "note") {
      if (google_drive_url && google_drive_url.includes("drive.google.com")) {
        const match = google_drive_url.match(/[-\w]{25,}/);
        if (match) {
          google_drive_id = match[0];
        }
      }

      if (!google_drive_id) {
        alert(
          "Invalid Google Drive URL. Please paste a valid link to extract the file ID.",
        );
        setIsLoading(false);
        return;
      }
    }

    if (resourceType === "note" && !selectedNoteId) {
      alert("Please select a note from your library.");
      setIsLoading(false);
      return;
    }

    const payload = {
      title_en: formData.get("title_en"),
      type: resourceType,
      exam_type: resourceType === "exam" ? formData.get("exam_type") : null,
      doctor_id: selectedDoctorId || null,
      google_drive_id: google_drive_id || null,
      google_drive_url: google_drive_url || null,
      note_id: resourceType === "note" ? selectedNoteId : null,
    };

    try {
      const token = await getAccessToken();

      const res = await fetch(
        `${getBackendUrl()}/api/data/courses/${courseId}/resources`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create resource");
      }

      setOpen(false);
      setSelectedNoteId("");
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
          className="w-full gap-2 mt-4 rounded-xl font-bold bg-primary/10 text-primary border-none hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5"
          variant="outline"
        >
          <Plus className="size-4 stroke-[3]" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-border/10 p-0 overflow-hidden shadow-2xl">
        <form onSubmit={onSubmit}>
          <div className="p-8 space-y-6">
            <header className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Add Resource
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Upload a new material or link a note to this course.
              </DialogDescription>
            </header>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label
                  htmlFor="title_en"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1"
                >
                  Title *
                </Label>
                <Input
                  id="title_en"
                  name="title_en"
                  required
                  placeholder="e.g. Midterm 2023"
                  className="rounded-xl h-11 border-border/40 focus:ring-primary/20"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="type"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1"
                >
                  Resource Type *
                </Label>
                <Select
                  name="type"
                  required
                  value={resourceType}
                  onValueChange={setResourceType}
                >
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
                  <Label
                    htmlFor="exam_type"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1"
                  >
                    Exam Type *
                  </Label>
                  <Select name="exam_type" required={resourceType === "exam"}>
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
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                    Select Note *
                  </Label>
                  <Popover
                    open={notePickerOpen}
                    onOpenChange={setNotePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={notePickerOpen}
                        className="w-full justify-between rounded-xl h-11 border-border/40 font-normal hover:bg-muted/10 transition-all"
                      >
                        {selectedNoteId
                          ? userNotes.find((n) => n.id === selectedNoteId)
                              ?.title || "Untitled"
                          : "Select from your library..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[380px] p-0 rounded-2xl border-border/10 shadow-2xl">
                      <Command>
                        <CommandInput
                          placeholder="Search your notes..."
                          className="h-10"
                        />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty className="py-6 text-sm text-center italic text-muted-foreground">
                            No notes found.
                          </CommandEmpty>
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
                                  <span className="font-semibold truncate">
                                    {note.title || "Untitled"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground opacity-60">
                                    Updated{" "}
                                    {new Date(
                                      note.updated_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4 text-primary",
                                    selectedNoteId === note.id
                                      ? "opacity-100"
                                      : "opacity-0",
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
                <Label
                  htmlFor="doctor_id"
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1"
                >
                  Instructor
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Popover
                      open={doctorPickerOpen}
                      onOpenChange={setDoctorPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={doctorPickerOpen}
                          className="w-full justify-between rounded-xl h-11 border-border/40 font-normal hover:bg-muted/10 transition-all"
                        >
                          {selectedDoctorId
                            ? doctors.find((d) => d.id === selectedDoctorId)
                                ?.name_en || "Unknown"
                            : "Select instructor (optional)"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[380px] p-0 rounded-2xl border-border/10 shadow-2xl">
                        <Command>
                          <CommandInput
                            placeholder="Search instructors..."
                            className="h-10"
                          />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty className="py-6 text-sm text-center italic text-muted-foreground">
                              No instructors found.
                            </CommandEmpty>
                            <CommandGroup heading="Instructors">
                              <CommandItem
                                value="none"
                                onSelect={() => {
                                  setSelectedDoctorId("");
                                  setDoctorPickerOpen(false);
                                }}
                                className="py-3 px-4 flex items-center gap-3 cursor-pointer"
                              >
                                <span className="font-semibold truncate">
                                  No Instructor (Clear)
                                </span>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4 text-primary",
                                    !selectedDoctorId
                                      ? "opacity-100"
                                      : "opacity-0",
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
                                  <span className="font-semibold truncate">
                                    {doc.name_en}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4 text-primary",
                                      selectedDoctorId === doc.id
                                        ? "opacity-100"
                                        : "opacity-0",
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
                  {isAdmin && (
                    <AddDoctorDialog
                      onSuccess={(newDoc) => setDoctors([...doctors, newDoc])}
                    />
                  )}
                </div>
              </div>

              {resourceType !== "note" && (
                <div className="grid gap-2">
                  <Label
                    htmlFor="google_drive_url"
                    className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1"
                  >
                    Google Drive URL *
                  </Label>
                  <Input
                    id="google_drive_url"
                    name="google_drive_url"
                    required
                    placeholder="Paste full Google Drive link"
                    className="rounded-xl h-11 border-border/40 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="bg-muted/10 p-6 pt-4 border-t border-border/5">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl h-12 font-bold text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? "Synchronizing..." : "Publish to Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
