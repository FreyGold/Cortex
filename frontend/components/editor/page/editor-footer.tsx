"use client";

import { cn } from "@/lib/utils";

interface EditorFooterProps {
  isFullWidth: boolean;
}

export function EditorFooter({ isFullWidth }: EditorFooterProps) {
  return (
    <footer className="border-t border-border py-4 bg-background">
      <div
        className={cn(
          "px-4 flex items-center justify-between text-xs text-muted-foreground transition-all duration-300",
          isFullWidth ? "w-full px-8" : "container mx-auto max-w-4xl"
        )}
      >
        <span>Cortex Editor v1.0</span>
        <div className="flex items-center gap-4">
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-muted">/</kbd> for commands
          </span>
          <span>•</span>
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-muted">⌘K</kbd> to open shortcuts
          </span>
        </div>
      </div>
    </footer>
  );
}
