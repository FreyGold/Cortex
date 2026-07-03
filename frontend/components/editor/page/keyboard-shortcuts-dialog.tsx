"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useState } from "react";
import {
  KeyboardShortcutBadge,
  SelectedRow,
  SelectionIndicator,
} from "@/components/editor/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { EditorShortcut } from "./editor-shortcuts";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: EditorShortcut[];
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % shortcuts.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + shortcuts.length) % shortcuts.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, shortcuts.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Keyboard shortcuts">
          <Keyboard className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto scrollbar-none">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your writing with these shortcuts. Use ↑↓ to navigate.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 mt-4">
          {shortcuts.map((shortcut, index) => {
            const isSelected = index === selectedIndex;
            return (
              <SelectedRow
                key={shortcut.id}
                isSelected={isSelected}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-3">
                  <SelectionIndicator isSelected={isSelected} />
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      isSelected && "text-primary font-medium",
                    )}
                  >
                    {shortcut.description}
                  </span>
                </div>
                <KeyboardShortcutBadge
                  shortcut={shortcut}
                  variant={isSelected ? "active" : "default"}
                />
              </SelectedRow>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
