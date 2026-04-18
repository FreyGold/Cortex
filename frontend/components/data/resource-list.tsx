"use client";

import {
  DownloadSimple,
  Eye,
  FileText,
  FolderOpen,
  Ghost,
  GridFour,
  List,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { DriveViewerDialog } from "@/components/data/drive-viewer-dialog";
import { EditResourceDialog } from "@/components/data/edit-resource-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Doctor, Resource } from "@/lib/data/catalog";

type Props = {
  resources: Resource[];
  doctorsById: Map<string, Doctor>;
  selectedType: string | null;
  selectedDoctorId: string | null;
  isAdmin?: boolean;
  doctors?: Doctor[];
};

type ViewMode = "card" | "table";

export function ResourceList({
  resources,
  doctorsById,
  selectedType,
  selectedDoctorId,
  isAdmin = false,
  doctors = [],
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const filtered = resources.filter((resource) => {
    const typeMatch = !selectedType || resource.type === selectedType;
    const doctorMatch =
      !selectedDoctorId || resource.doctor_id === selectedDoctorId;
    return typeMatch && doctorMatch;
  });

  if (filtered.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border/70 shadow-none">
        <CardContent className="py-14 text-center">
          <Ghost
            className="mx-auto mb-3 size-10 text-muted-foreground/60"
            weight="duotone"
          />
          <h3 className="text-base font-semibold">No resources found</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Try changing the selected filters or clearing the current selection.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-muted/20 p-1">
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setViewMode("card")}
          >
            <GridFour className="size-4" />
            Cards
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setViewMode("table")}
          >
            <List className="size-4" />
            Table
          </Button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid gap-3">
          {filtered.map((resource) => {
            const doctor = resource.doctor_id
              ? doctorsById.get(resource.doctor_id)
              : undefined;
            const isFolder =
              resource.google_drive_url?.includes("/folders/") ?? false;

            return (
              <Card key={resource.id} className="border-border/70 shadow-none">
                <CardHeader className="space-y-3 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {resource.type}
                    </Badge>
                    {resource.exam_type ? (
                      <Badge variant="outline">{resource.exam_type}</Badge>
                    ) : null}
                    {resource.file_type && !isFolder ? (
                      <Badge variant="outline" className="uppercase">
                        {resource.file_type}
                      </Badge>
                    ) : null}
                  </div>

                  <CardTitle className="text-base leading-snug">
                    {resource.title_en}
                  </CardTitle>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="size-3.5" />
                    {doctor?.name_en ?? "Unassigned instructor"}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" />
                      {resource.view_count ?? 0} views
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <DownloadSimple className="size-3.5" />
                      {resource.download_count ?? 0} downloads
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DriveViewerDialog
                      driveId={resource.google_drive_id}
                      driveUrl={resource.google_drive_url}
                      title={resource.title_en}
                      triggerVariant="default"
                      triggerLabel={isFolder ? "Open folder" : "Open file"}
                    />

                    {isAdmin ? (
                      <EditResourceDialog
                        resource={resource}
                        doctors={doctors}
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="w-[42px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-right">Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((resource) => {
                const doctor = resource.doctor_id
                  ? doctorsById.get(resource.doctor_id)
                  : undefined;
                const isFolder =
                  resource.google_drive_url?.includes("/folders/") ?? false;
                const Icon = isFolder ? FolderOpen : FileText;

                return (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <Icon className="size-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {resource.title_en}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {resource.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doctor?.name_en ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {(resource.view_count ?? 0).toLocaleString()} /{" "}
                      {(resource.download_count ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin ? (
                          <EditResourceDialog
                            resource={resource}
                            doctors={doctors}
                          />
                        ) : null}
                        <DriveViewerDialog
                          driveId={resource.google_drive_id}
                          driveUrl={resource.google_drive_url}
                          title={resource.title_en}
                          triggerLabel={isFolder ? "Open folder" : "Open file"}
                        />
                      </div>
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
