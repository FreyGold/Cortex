"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Ghost, GridFour, List } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Course, Major, YearLevel } from "@/lib/data/catalog";

type Props = {
  courses: Course[];
  majors: Major[];
  yearLevels: YearLevel[];
  emptyTitle: string;
  emptyDescription: string;
  noDescriptionText: string;
};

type ViewMode = "card" | "table";

export function CourseList({
  courses,
  majors,
  yearLevels,
  emptyTitle,
  emptyDescription,
  noDescriptionText,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const majorsById = new Map(majors.map((item) => [item.id, item]));
  const yearLevelsById = new Map(yearLevels.map((item) => [item.id, item]));

  if (courses.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardHeader className="text-center py-12">
          <Ghost className="mx-auto size-12 text-muted-foreground/50 mb-4" />
          <CardTitle>{emptyTitle}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2.5 rounded-md"
            onClick={() => setViewMode("card")}
          >
            <GridFour className="size-4 mr-1.5" />
            <span className="text-xs font-medium">Cards</span>
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2.5 rounded-md"
            onClick={() => setViewMode("table")}
          >
            <List className="size-4 mr-1.5" />
            <span className="text-xs font-medium">Table</span>
          </Button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const majorItem = majorsById.get(course.major_id);
            const yearItem = course.year_level_id
              ? yearLevelsById.get(course.year_level_id)
              : null;

            return (
              <Link
                key={course.id}
                href={`/data/${course.id}`}
                className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              >
                <Card className="flex h-full flex-col hover:border-primary/50 transition-colors">
                  <CardHeader className="space-y-2 pb-4">
                    <div className="flex items-center gap-2">
                      {course.code && (
                        <Badge variant="outline" className="text-[10px]">
                          {course.code}
                        </Badge>
                      )}
                      {yearItem && (
                        <Badge variant="outline" className="text-[10px]">
                          Y{yearItem.level}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base line-clamp-2">
                      {course.name_en}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">
                      {course.description || noDescriptionText}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto pt-0 pb-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">
                      {majorItem?.name_en ?? "No Major"}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Major</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const majorItem = majorsById.get(course.major_id);
                const yearItem = course.year_level_id
                  ? yearLevelsById.get(course.year_level_id)
                  : null;

                return (
                  <TableRow key={course.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-xs">
                      {course.code ? (
                        <Badge variant="outline" className="text-[10px]">
                          {course.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-sm max-w-[200px] truncate">
                      {course.name_en}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {majorItem?.name_en ?? "No Major"}
                    </TableCell>
                    <TableCell>
                      {yearItem ? (
                        <Badge variant="muted" className="text-[10px]">
                          Y{yearItem.level}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0 rounded-full">
                        <Link href={`/data/${course.id}`}>
                          <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="sr-only">View course</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}