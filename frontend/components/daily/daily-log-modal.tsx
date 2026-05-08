"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DailyLogView } from "./daily-log-view";

interface DailyLogModalProps {
  date: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

export function DailyLogModal({ date, isOpen, onOpenChange, workspaceId }: DailyLogModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] w-full h-[90vh] p-0 overflow-hidden rounded-2xl border-border/10 shadow-2xl">
        <DialogTitle className="sr-only">Daily Log for {date}</DialogTitle>
        <DailyLogView date={date} workspaceId={workspaceId} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
