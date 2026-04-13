"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useCallback, useState, useRef, useEffect } from "react";
import { editorExtensions } from "./extensions";
import { useEditorShortcuts } from "./use-editor-shortcuts";
import { SlashCommandMenu } from "./slash-command-menu";
import { BubbleMenuContent } from "./bubble-menu-content";
import { EditorContextMenu } from "./context-menu";
import { EditorToolbar } from "./toolbar";
import { cn } from "@/lib/utils";

interface NotionEditorProps {
  content?: string | Record<string, unknown>;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  showToolbar?: boolean;
  autofocus?: boolean;
}

export function NotionEditor({
  content = "",
  onChange,
  className,
  editorClassName,
  showToolbar = true,
  autofocus = true,
}: NotionEditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: editorExtensions,
    content,
    autofocus,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-neutral dark:prose-invert max-w-none focus:outline-none pl-10 pr-2",
          "prose-headings:font-heading prose-headings:tracking-tight",
          "prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-4",
          "prose-h2:text-2xl prose-h2:font-semibold prose-h2:mb-3",
          "prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-2",
          "prose-p:text-base prose-p:leading-relaxed prose-p:mb-4",
          "prose-a:text-brand-text prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-l-4 prose-blockquote:border-brand prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
          "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-4",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-li:marker:text-muted-foreground",
          "prose-hr:border-border prose-hr:my-8",
          "prose-img:rounded-lg prose-img:shadow-card",
          editorClassName
        ),
      },
      handleKeyDown: (view, event) => {
        // Handle slash command trigger
        if (event.key === "/" && !slashMenuOpen) {
          // Get cursor position for menu placement
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          setSlashMenuPosition({
            top: coords.top,
            left: coords.left,
          });
          // Delay to let the "/" be inserted first
          setTimeout(() => setSlashMenuOpen(true), 10);
          return false;
        }

        // Close slash menu on Escape
        if (event.key === "Escape" && slashMenuOpen) {
          setSlashMenuOpen(false);
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Use custom keyboard shortcuts
  useEditorShortcuts(editor);

  useEffect(() => {
    if (!editor) return;

    if (
      typeof content === "object" &&
      content !== null &&
      "html" in content &&
      typeof (content as { html?: unknown }).html === "string"
    ) {
      const htmlString = (content as { html: string }).html;
      const current = editor.getHTML();
      if (current !== htmlString) {
        editor.commands.setContent(htmlString || "", { emitUpdate: false });
      }
      return;
    }

    if (typeof content === "string") {
      const current = editor.getHTML();
      if (current !== content) {
        editor.commands.setContent(content || "", { emitUpdate: false });
      }
      return;
    }

    const currentJson = editor.getJSON();
    const incomingJson = content ?? {};
    if (JSON.stringify(currentJson) !== JSON.stringify(incomingJson)) {
      editor.commands.setContent(incomingJson, { emitUpdate: false });
    }
  }, [content, editor]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenuOpen) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [contextMenuOpen]);

  // Force drag handle to appear for the active block (Notion-like behavior)
  const triggerDragHandle = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    const x = coords.left + 4;
    const y = coords.top + 4;
    const event = new MouseEvent("mousemove", {
      clientX: x,
      clientY: y,
      bubbles: true,
    });
    editor.view.dom.dispatchEvent(event);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const update = () => requestAnimationFrame(triggerDragHandle);
    editor.on("selectionUpdate", update);
    editor.on("focus", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("focus", update);
    };
  }, [editor, triggerDragHandle]);

  // Watch for "/" deletion to close menu
  useEffect(() => {
    if (!editor || !slashMenuOpen) return;

    const checkSlashDeleted = () => {
      const { from } = editor.state.selection;
      if (from === 0) {
        setSlashMenuOpen(false);
        return;
      }

      // Get text before cursor
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        " "
      );

      // Check if there's still a "/" in the recent text
      if (!textBefore.includes("/")) {
        setSlashMenuOpen(false);
      }
    };

    editor.on("update", checkSlashDeleted);
    return () => {
      editor.off("update", checkSlashDeleted);
    };
  }, [editor, slashMenuOpen]);

  if (!editor) {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="h-12 bg-muted rounded-lg mb-4" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {showToolbar && <EditorToolbar editor={editor} className="mb-4" />}

      <div
        ref={editorContainerRef}
        onContextMenu={handleContextMenu}
        className={cn(
          "relative min-h-[300px] rounded-lg border border-border bg-card p-6 overflow-visible",
          "focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring/50",
          "transition-all duration-200"
        )}
      >
        <EditorContent editor={editor} className="min-h-[250px] relative overflow-visible" />

        {/* Bubble Menu - appears on text selection */}
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor, state }) => {
            const { selection } = state;
            const { empty } = selection;
            // Don't show on empty selection or code blocks
            if (empty || editor.isActive("codeBlock")) {
              return false;
            }
            return true;
          }}
          className="animate-in fade-in-0 zoom-in-95"
        >
          <BubbleMenuContent editor={editor} />
        </BubbleMenu>

        {/* Slash Command Menu */}
        <SlashCommandMenu
          editor={editor}
          isOpen={slashMenuOpen}
          onClose={() => setSlashMenuOpen(false)}
          position={slashMenuPosition}
        />

        {/* Right-click Context Menu */}
        <EditorContextMenu
          editor={editor}
          isOpen={contextMenuOpen}
          onClose={() => setContextMenuOpen(false)}
          position={contextMenuPosition}
        />
      </div>

      {/* Shortcuts hint */}
      <div className="flex items-center justify-end mt-3 px-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Type <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">/</kbd> for commands
          </span>
          <span className="text-border">•</span>
          <span>Right-click for more options</span>
        </div>
      </div>
    </div>
  );
}
