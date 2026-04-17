"use client";

import { useCallback, useEffect, useState } from "react";
import { NotionEditor } from "@/components/editor";
import { EDITOR_DEMO_CONTENT } from "@/components/editor/page/editor-demo-content";
import { EditorFooter } from "@/components/editor/page/editor-footer";
import { EditorHeader } from "@/components/editor/page/editor-header";
import { EDITOR_SHORTCUTS } from "@/components/editor/page/editor-shortcuts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function EditorPageContent() {
  const [content, setContent] = useState(EDITOR_DEMO_CONTENT);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Listen for Ctrl+K / Cmd+K to open shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSave = useCallback(() => {
    // In a real app, this would save to a backend
    console.log("Saving content:", content);
    setLastSaved(new Date());
  }, [content]);

  const handleExport = useCallback(() => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "note.html";
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const toggleFullWidth = useCallback(() => {
    setIsFullWidth((prev) => !prev);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background flex flex-col">
        <EditorHeader
          lastSaved={lastSaved}
          onExport={handleExport}
          onSave={handleSave}
          isFullWidth={isFullWidth}
          onToggleFullWidth={toggleFullWidth}
          shortcutsOpen={shortcutsOpen}
          onShortcutsOpenChange={setShortcutsOpen}
          shortcuts={EDITOR_SHORTCUTS}
        />

        {/* Main Editor Area */}
        <main
          className={cn(
            "flex-1 px-4 py-8 transition-all duration-300",
            isFullWidth
              ? "w-full max-w-none px-8"
              : "container mx-auto max-w-4xl",
          )}
        >
          <NotionEditor
            content={content}
            onChange={setContent}
            showToolbar={true}
            autofocus={true}
            editorClassName="min-h-[60vh]"
          />
        </main>

        <EditorFooter isFullWidth={isFullWidth} />
      </div>
    </TooltipProvider>
  );
}
