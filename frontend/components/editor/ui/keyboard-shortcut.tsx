"use client";

import { cn } from "@/lib/utils";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

interface KeyboardShortcutBadgeProps {
  shortcut: KeyboardShortcut;
  variant?: "default" | "active";
  className?: string;
}

function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  const isMac =
    typeof navigator !== "undefined" && navigator.platform.includes("Mac");

  if (shortcut.ctrl) parts.push(isMac ? "⌘" : "Ctrl");
  if (shortcut.alt) parts.push(isMac ? "⌥" : "Alt");
  if (shortcut.shift) parts.push("⇧");
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? "" : "+");
}

export function KeyboardShortcutBadge({
  shortcut,
  variant = "default",
  className,
}: KeyboardShortcutBadgeProps) {
  return (
    <kbd
      className={cn(
        "px-2 py-1 rounded text-xs font-mono transition-colors",
        variant === "active"
          ? "bg-primary/15 text-primary"
          : "bg-muted",
        className
      )}
    >
      {formatShortcut(shortcut)}
    </kbd>
  );
}
