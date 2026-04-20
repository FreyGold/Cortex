"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { College, Major, YearLevel } from "@/lib/data/catalog";
import { getBackendUrl } from "@/lib/api/backend-url";
import { getAccessToken } from "@/lib/supabase/client";

type Props = {
  colleges: College[];
  majors: Major[];
  yearLevels: YearLevel[];
};

export function CourseDialog({ colleges, majors, yearLevels }: Props) {
  const defaultCollege = colleges.find(
    (c) => c.slug === "fee" || c.name_en.toLowerCase().includes("electronic")
  );

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(
    defaultCollege?.id ?? ""
  );
  const [selectedMajorId, setSelectedMajorId] = useState<string>("");

  const [openCollege, setOpenCollege] = useState(false);
  const [openMajor, setOpenMajor] = useState(false);

  const router = useRouter();

  const filteredMajors = majors.filter((m) => m.college_id === selectedCollegeId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMajorId) {
      alert("Please select a major.");
      return;
    }
    
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      major_id: selectedMajorId,
      year_level_id: formData.get("year_level_id") || null,
      name_en: formData.get("name_en"),
      code: formData.get("code") || null,
      description: formData.get("description") || null,
    };

    try {
      const token = await getAccessToken();

      const res = await fetch(`${getBackendUrl()}/api/data/courses`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create course");
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
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Create a new course in the catalog.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <div className="grid gap-2">
              <Label htmlFor="name_en">Course Name (English) *</Label>
              <Input id="name_en" name="name_en" required placeholder="e.g. Data Structures" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" name="code" placeholder="e.g. CS101" />
            </div>
            
            <div className="grid gap-2">
              <Label>College *</Label>
              <Popover open={openCollege} onOpenChange={setOpenCollege}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCollege}
                    className="justify-between w-full font-normal"
                  >
                    <span className="truncate">
                      {selectedCollegeId
                        ? colleges.find((c) => c.id === selectedCollegeId)?.name_en
                        : "Select college..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[375px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search college..." />
                    <CommandList>
                      <CommandEmpty>No college found.</CommandEmpty>
                      <CommandGroup>
                        {colleges.map((college) => (
                          <CommandItem
                            key={college.id}
                            value={college.name_en}
                            onSelect={() => {
                              setSelectedCollegeId(college.id);
                              setSelectedMajorId("");
                              setOpenCollege(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCollegeId === college.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {college.name_en}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Major *</Label>
              <input type="hidden" name="major_id" value={selectedMajorId} required />
              <Popover open={openMajor} onOpenChange={setOpenMajor}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openMajor}
                    className="justify-between w-full font-normal"
                    disabled={!selectedCollegeId}
                  >
                    <span className="truncate">
                      {selectedMajorId
                        ? filteredMajors.find((m) => m.id === selectedMajorId)?.name_en
                        : "Select major..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[375px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search major..." />
                    <CommandList>
                      <CommandEmpty>No major found.</CommandEmpty>
                      <CommandGroup>
                        {filteredMajors.map((major) => (
                          <CommandItem
                            key={major.id}
                            value={major.name_en}
                            onSelect={() => {
                              setSelectedMajorId(major.id);
                              setOpenMajor(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMajorId === major.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {major.name_en}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="year_level_id">Year Level</Label>
              <Select name="year_level_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select year (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {yearLevels.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      Year {year.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief description of the course..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}