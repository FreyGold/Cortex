"use client";

import { useState } from "react";
import {
  ArrowSquareOut,
  DownloadSimple,
  Eye,
  FileText,
  FolderOpen,
  Ghost,
  User,
  GridFour,
  List,
} from "@phosphor-icons/react/dist/ssr";
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
import { EditResourceDialog } from "@/components/data/edit-resource-dialog";

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
      <Card className="border-dashed border-2 shadow-none bg-muted/5 animate-in fade-in zoom-in-95 duration-500">
        <CardContent className="py-16 px-6 text-center">
          <div className="mx-auto bg-muted/30 p-4 rounded-full w-fit mb-4 group hover:bg-muted/50 transition-colors duration-500">
            <Ghost
              className="size-10 text-muted-foreground/50 group-hover:-translate-y-1 group-hover:rotate-12 group-hover:text-primary/50 transition-all duration-500 ease-out-quart"
              weight="duotone"
            />
          </div>
          <h3 className="text-lg font-bold tracking-tight mb-2">
            No resources found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            We couldn't find any resources matching your current filters. Try
            adjusting them or clearing selections.
          </p>
        </CardContent>
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
        <div className="grid gap-4">
          {filtered.map((resource, index) => {
            const doctor = resource.doctor_id
              ? doctorsById.get(resource.doctor_id)
              : undefined;
            const driveUrl =
              resource.google_drive_url ??
              `https://drive.google.com/file/d/${resource.google_drive_id}/view`;
            const isFolder = driveUrl.includes("/folders/");
            const Icon = isFolder ? FolderOpen : FileText;

            return (
              <Card
                key={resource.id}
                className="shadow-sm border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-400 ease-out-quart group bg-card/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDelay: `${Math.min(index * 50, 500)}ms`,
                  animationFillMode: "both",
                }}
              >
                <CardHeader className="pb-3 px-5 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                          <Icon className="size-4" weight="duotone" />
                        </div>
                        <Badge
                          variant="synapse"
                          className="h-5 px-2 text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/20 group-hover:border-primary/40 transition-colors"
                        >
                          {resource.type}
                        </Badge>
                        {resource.exam_type && (
                          <Badge
                            variant="outline"
                            className="h-5 px-2 text-[10px] font-semibold border-border/60 text-muted-foreground"
                          >
                            {resource.exam_type}
                          </Badge>
                        )}
                      </div>

                      <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors duration-300">
                        {resource.title_en}
                      </CardTitle>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <User className="size-3.5 opacity-70" />
                        {doctor?.name_en ?? "Unassigned instructor"}
                      </div>
                    </div>

                    {resource.file_type && !isFolder && (
                      <Badge
                        variant="muted"
                        className="h-6 px-2 text-[10px] font-bold tracking-widest bg-muted/50 uppercase"
                      >
                        {resource.file_type}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 border-t border-border/40 pt-4 mt-2">
                    <div className="flex items-center gap-1.5 group/stat hover:text-foreground transition-colors cursor-default">
                      <Eye className="size-3.5 group-hover/stat:text-primary transition-colors" />
                      <span>{resource.view_count ?? 0} Views</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-border/80"></div>
                    <div className="flex items-center gap-1.5 group/stat hover:text-foreground transition-colors cursor-default">
                      <DownloadSimple className="size-3.5 group-hover/stat:text-primary transition-colors" />
                      <span>{resource.download_count ?? 0} Downloads</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="default"
                      asChild
                      className="h-9 px-4 gap-2 font-medium shadow-sm hover:shadow active:scale-[0.98] transition-all rounded-full"
                    >
                      <a href={driveUrl} target="_blank" rel="noreferrer">
                        {isFolder ? (
                          <FolderOpen className="size-4" weight="bold" />
                        ) : (
                          <DownloadSimple className="size-4" weight="bold" />
                        )}
                        {isFolder ? "Open Folder" : "Download"}
                      </a>
                    </Button>
                    {!isFolder && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-9 px-4 gap-2 font-medium bg-background hover:bg-muted/50 active:scale-[0.98] transition-all rounded-full"
                      >
                        <a
                          href={`https://drive.google.com/file/d/${resource.google_drive_id}/preview`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ArrowSquareOut className="size-4" />
                          Open in Drive
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-right">Metrics</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((resource) => {
                const doctor = resource.doctor_id
                  ? doctorsById.get(resource.doctor_id)
                  : undefined;
                const driveUrl =
                  resource.google_drive_url ??
                  `https://drive.google.com/file/d/${resource.google_drive_id}/view`;
                const isFolder = driveUrl.includes("/folders/");
                const Icon = isFolder ? FolderOpen : FileText;

                return (
                  <TableRow
                    key={resource.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="pl-5">
                      <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 w-max">
                        <Icon className="size-4" weight="duotone" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {resource.title_en}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="synapse"
                        className="h-5 px-2 text-[10px] font-bold uppercase tracking-widest bg-primary/5 text-primary border-primary/20"
                      >
                        {resource.type}
                      </Badge>
                      {resource.exam_type && (
                        <Badge
                          variant="outline"
                          className="h-5 px-2 text-[10px] font-semibold border-border/60 text-muted-foreground ml-1"
                        >
                          {resource.exam_type}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {doctor?.name_en ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                      <div className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1">
                          <Eye className="size-3" /> {resource.view_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <DownloadSimple className="size-3" />{" "}
                          {resource.download_count ?? 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <EditResourceDialog resource={resource} doctors={doctors} />
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          asChild
                          className="h-8 px-3 gap-1.5 font-medium rounded-full"
                        >
                          <a href={driveUrl} target="_blank" rel="noreferrer">
                            {isFolder ? (
                              <FolderOpen className="size-3.5" weight="bold" />
                            ) : (
                              <DownloadSimple
                                className="size-3.5"
                                weight="bold"
                              />
                            )}
                            {isFolder ? "Open" : "Download"}
                          </a>
                        </Button>
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