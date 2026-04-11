"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useMemo } from "react";

interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: (editor: Editor) => void;
  description: string;
}

export function useEditorShortcuts(editor: Editor | null) {
  const shortcuts: ShortcutDef[] = useMemo(
    () => [
      // Text formatting
      {
        key: "b",
        ctrl: true,
        action: (e) => e.chain().focus().toggleBold().run(),
        description: "Bold",
      },
      {
        key: "i",
        ctrl: true,
        action: (e) => e.chain().focus().toggleItalic().run(),
        description: "Italic",
      },
      {
        key: "u",
        ctrl: true,
        action: (e) => e.chain().focus().toggleUnderline().run(),
        description: "Underline",
      },
      {
        key: "e",
        ctrl: true,
        action: (e) => e.chain().focus().toggleCode().run(),
        description: "Inline code",
      },
      {
        key: "h",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().toggleHighlight().run(),
        description: "Highlight",
      },
      {
        key: "x",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().toggleStrike().run(),
        description: "Strikethrough",
      },

      // Headings
      {
        key: "1",
        ctrl: true,
        alt: true,
        action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
        description: "Heading 1",
      },
      {
        key: "2",
        ctrl: true,
        alt: true,
        action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
        description: "Heading 2",
      },
      {
        key: "3",
        ctrl: true,
        alt: true,
        action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
        description: "Heading 3",
      },

      // Blocks
      {
        key: ".",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().toggleBulletList().run(),
        description: "Bullet list",
      },
      {
        key: "/",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().toggleOrderedList().run(),
        description: "Numbered list",
      },
      {
        key: "9",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().toggleBlockquote().run(),
        description: "Blockquote",
      },
      {
        key: "`",
        ctrl: true,
        alt: true,
        action: (e) => e.chain().focus().toggleCodeBlock().run(),
        description: "Code block",
      },
      {
        key: "t",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().toggleTaskList().run(),
        description: "Task list",
      },

      // Alignment
      {
        key: "l",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().setTextAlign("left").run(),
        description: "Align left",
      },
      {
        key: "e",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().setTextAlign("center").run(),
        description: "Align center",
      },
      {
        key: "r",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().setTextAlign("right").run(),
        description: "Align right",
      },
      {
        key: "j",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().setTextAlign("justify").run(),
        description: "Justify",
      },

      // Undo/Redo
      {
        key: "z",
        ctrl: true,
        action: (e) => e.chain().focus().undo().run(),
        description: "Undo",
      },
      {
        key: "z",
        ctrl: true,
        shift: true,
        action: (e) => e.chain().focus().redo().run(),
        description: "Redo",
      },
      {
        key: "y",
        ctrl: true,
        action: (e) => e.chain().focus().redo().run(),
        description: "Redo (alt)",
      },

      // Actions
      {
        key: "Enter",
        ctrl: true,
        action: (e) => e.chain().focus().setHardBreak().run(),
        description: "Hard break",
      },
      {
        key: "-",
        ctrl: true,
        action: (e) => e.chain().focus().setHorizontalRule().run(),
        description: "Horizontal rule",
      },
    ],
    []
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!editor) return;

      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
      const ctrl = ctrlKey || metaKey;

      for (const shortcut of shortcuts) {
        const keyMatches = key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrl === ctrl;
        const shiftMatches = !!shortcut.shift === shiftKey;
        const altMatches = !!shortcut.alt === altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action(editor);
          return;
        }
      }
    },
    [editor, shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
