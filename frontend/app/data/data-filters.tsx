"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { College, Major, University, YearLevel } from "@/lib/data/catalog";

type DataFiltersProps = {
  universities: University[];
  colleges: College[];
  majors: Major[];
  yearLevels: YearLevel[];
  selectedUniversityId: string | null;
  selectedCollegeId: string | null;
  selectedMajorId: string | null;
  selectedYearId: string | null;
  q: string;
};

export function DataFilters({
  universities,
  colleges,
  majors,
  yearLevels,
  selectedUniversityId,
  selectedCollegeId,
  selectedMajorId,
  selectedYearId,
  q,
}: DataFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    // When university changes, reset college and major
    if (updates.university !== undefined) {
      if (updates.university) {
        params.set("university", updates.university);
      } else {
        params.delete("university");
      }
      params.delete("college");
      params.delete("major");
    }
    // When college changes, reset major
    else if (updates.college !== undefined) {
      if (updates.college) {
        params.set("college", updates.college);
      } else {
        params.delete("college");
      }
      params.delete("major");
    }
    // Handle other updates
    else {
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
    }

    startTransition(() => {
      router.push(`/data?${params.toString()}`);
    });
  }

  const filteredColleges = colleges.filter(
    (c) => !selectedUniversityId || c.university_id === selectedUniversityId,
  );

  const filteredMajors = majors.filter(
    (m) => !selectedCollegeId || m.college_id === selectedCollegeId,
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          id="data-search"
          defaultValue={q}
          placeholder="Search courses..."
          className="h-10 pl-9"
          onChange={(e) => {
            // Debounce search
            const handler = setTimeout(() => {
              updateParams({ q: e.target.value });
            }, 300);
            return () => clearTimeout(handler);
          }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          University
        </label>
        <Select
          value={selectedUniversityId ?? "all"}
          onValueChange={(val) =>
            updateParams({ university: val === "all" ? null : val })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Universities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {universities.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          College
        </label>
        <Select
          value={selectedCollegeId ?? "all"}
          onValueChange={(val) =>
            updateParams({ college: val === "all" ? null : val })
          }
          disabled={filteredColleges.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Colleges" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colleges</SelectItem>
            {filteredColleges.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Major
        </label>
        <Select
          value={selectedMajorId ?? "all"}
          onValueChange={(val) =>
            updateParams({ major: val === "all" ? null : val })
          }
          disabled={filteredMajors.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Majors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Majors</SelectItem>
            {filteredMajors.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground">
          Year Level
        </label>
        <Select
          value={selectedYearId ?? "all"}
          onValueChange={(val) =>
            updateParams({ year: val === "all" ? null : val })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {yearLevels.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                Year {y.level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            // keep default university and college if we are "clearing" to default state
            // wait, just clear all makes it easier to navigate.
            // Or reset to default values. For now, clear all.
            router.push("/data");
          }}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
