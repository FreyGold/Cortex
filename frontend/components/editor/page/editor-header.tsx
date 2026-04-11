"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FloppyDisk,
  ArrowLeft,
  DotsThree,
  Export,
  Clock,
  ArrowsOutSimple,
  ArrowsInSimple,
} from "@phosphor-icons/react";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";
import type { EditorShortcut } from "./editor-shortcuts";

interface EditorHeaderProps {
  lastSaved: Date | null;
  onExport: () => void;
  onSave: () => void;
  isFullWidth: boolean;
  onToggleFullWidth: () => void;
  shortcutsOpen: boolean;
  onShortcutsOpenChange: (open: boolean) => void;
  shortcuts: EditorShortcut[];
  title?: string;
}

export function EditorHeader({
  lastSaved,
  onExport,
  onSave,
  isFullWidth,
  onToggleFullWidth,
  shortcutsOpen,
  onShortcutsOpenChange,
  shortcuts,
  title = "Cortex Editor",
}: EditorHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon-sm" aria-label="Back">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-[0.25rem] bg-primary flex items-center justify-center shadow-brand">
              <span className="text-white font-bold text-xs leading-none">C</span>
            </div>
            <span className="text-[0.9375rem] font-bold tracking-tight">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}

          <KeyboardShortcutsDialog
            open={shortcutsOpen}
            onOpenChange={onShortcutsOpenChange}
            shortcuts={shortcuts}
          />

          <Button variant="ghost" size="icon-sm" onClick={onExport}>
            <Export className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFullWidth}
            title={isFullWidth ? "Exit full width" : "Full width"}
          >
            {isFullWidth ? (
              <ArrowsInSimple className="size-4" />
            ) : (
              <ArrowsOutSimple className="size-4" />
            )}
          </Button>

          <Button variant="ghost" size="icon-sm">
            <DotsThree className="size-4" weight="bold" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="gap-1.5"
          >
            <FloppyDisk className="size-4" />
            Save
          </Button>
        </div>
      </div>
    </header>
  );
}
