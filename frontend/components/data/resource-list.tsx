"use client";

import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Ghost,
  LayoutGrid,
  List,
  User,
  ArrowRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import Link from "next/link";
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
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 rounded-3xl border border-dashed border-border/10 bg-muted/5">
        <div className="size-16 rounded-3xl bg-muted/10 flex items-center justify-center">
          <Ghost className="size-8 text-muted-foreground/20" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-muted-foreground">No resources found</p>
          <p className="text-sm text-muted-foreground/40">Try changing the filters to explore more materials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border/10 bg-muted/20 p-1">
          <button
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "card" ? "bg-background text-primary shadow-sm" : "text-muted-foreground/40 hover:text-foreground")}
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            className={cn("p-1.5 rounded-lg transition-all", viewMode === "table" ? "bg-background text-primary shadow-sm" : "text-muted-foreground/40 hover:text-foreground")}
            onClick={() => setViewMode("table")}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((resource) => {
            const doctor = resource.doctor_id
              ? doctorsById.get(resource.doctor_id)
              : undefined;
            const isFolder =
              resource.google_drive_url?.includes("/folders/") ?? false;
            
            const isNote = !!resource.note_id;

            return (
              <div key={resource.id} className="group relative flex flex-col p-5 rounded-3xl border border-border/40 bg-card hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-0.5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                   <div className={cn(
                      "size-10 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      isNote ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                   )}>
                      {isNote ? <Sparkles className="size-5" /> : (isFolder ? <FolderOpen className="size-5" /> : <FileText className="size-5" />)}
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-extrabold uppercase tracking-widest border-border/20 text-muted-foreground/50 h-5 px-1.5 rounded-md">
                        {resource.type}
                      </Badge>
                      {isNote && (
                        <Badge variant="secondary" className="text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none h-5 px-1.5 rounded-md">
                            Note
                        </Badge>
                      )}
                   </div>
                </div>

                <h3 className="text-[15px] font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                   {resource.title_en}
                </h3>

                <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 mb-6">
                  <User className="size-3" />
                  {doctor?.name_en ?? "Unassigned"}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30 border-t border-border/5 pt-4">
                    <span className="flex items-center gap-1">
                      <Eye className="size-3" />
                      {resource.view_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="size-3" />
                      {resource.download_count ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isNote ? (
                        <Button asChild className="h-9 flex-1 text-[11px] font-bold uppercase tracking-wider rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all">
                            <Link href={`/notes/${resource.note_id}`}>
                                <Eye className="size-3.5" />
                                Read Note
                            </Link>
                        </Button>
                    ) : (
                        <DriveViewerDialog
                            driveId={resource.google_drive_id || ""}
                            driveUrl={resource.google_drive_url || ""}
                            title={resource.title_en}
                            triggerVariant="default"
                            triggerLabel={isFolder ? "Open Folder" : "View File"}
                            className="h-9 flex-1 text-[11px] font-bold uppercase tracking-wider rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all"
                        />
                    )}

                    {isAdmin && (
                      <EditResourceDialog
                        resource={resource}
                        doctors={doctors}
                        triggerClassName="h-9 w-9 rounded-xl border-border/40 hover:bg-accent/40"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border/40 bg-card/30">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 border-border/5 hover:bg-muted/10">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Title</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Type</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Instructor</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Stats</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((resource) => {
                const doctor = resource.doctor_id
                  ? doctorsById.get(resource.doctor_id)
                  : undefined;
                const isFolder =
                  resource.google_drive_url?.includes("/folders/") ?? false;
                const isNote = !!resource.note_id;
                const Icon = isNote ? Sparkles : (isFolder ? FolderOpen : FileText);

                return (
                  <TableRow key={resource.id} className="border-border/5 group hover:bg-muted/5 transition-colors">
                    <TableCell>
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center transition-all",
                        isNote ? "bg-emerald-500/10 text-emerald-500" : "bg-muted/30 text-muted-foreground group-hover:text-primary"
                      )}>
                        <Icon className="size-4" />
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-sm tracking-tight">
                      {resource.title_en}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-extrabold uppercase tracking-widest border-border/20 text-muted-foreground/50 h-5 px-1.5 rounded-md">
                        {resource.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground/60">
                      {doctor?.name_en ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right text-[10px] font-bold text-muted-foreground/30 tabular-nums">
                      {resource.view_count ?? 0} / {resource.download_count ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isNote ? (
                            <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-500 hover:bg-emerald-500/10">
                                <Link href={`/notes/${resource.note_id}`}>
                                    <Eye className="size-4" />
                                </Link>
                            </Button>
                        ) : (
                            <DriveViewerDialog
                                driveId={resource.google_drive_id || ""}
                                driveUrl={resource.google_drive_url || ""}
                                title={resource.title_en}
                                triggerLabel={<ExternalLink className="size-4" />}
                                triggerClassName="h-8 w-8 p-0 rounded-lg"
                                triggerVariant="ghost"
                            />
                        )}
                        {isAdmin && (
                          <EditResourceDialog
                            resource={resource}
                            doctors={doctors}
                            triggerClassName="h-8 w-8 p-0 rounded-lg"
                          />
                        )}
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

