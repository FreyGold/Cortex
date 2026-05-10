"use client";

import type { Editor } from "@tiptap/react";
import {
  Redo as ArrowClockwise,
  Undo as ArrowCounterClockwise,
  ChevronRight as CaretRight,
  Clipboard as ClipboardText,
  Code,
  Copy,
  Highlighter,
  Link,
  Unlink as LinkBreak,
  List as ListBullets,
  ListTodo as ListChecks,
  ListOrdered as ListNumbers,
  Palette,
  Type as Paragraph,
  Quote as Quotes,
  Scissors,
  AlignCenter as TextAlignCenter,
  AlignLeft as TextAlignLeft,
  AlignRight as TextAlignRight,
  Bold as TextB,
  Heading1 as TextHOne,
  Heading3 as TextHThree,
  Heading2 as TextHTwo,
  Italic as TextItalic,
  Strikethrough as TextStrikethrough,
  Underline as TextUnderline,
  Trash2 as Trash,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

interface ContextMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export function EditorContextMenu({
  editor,
  isOpen,
  onClose,
  position,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: ContextMenuItem[] = [
    // Clipboard
    {
      id: "cut",
      label: "Cut",
      icon: <Scissors className="size-4" />,
      shortcut: "⌘X",
      action: () => {
        document.execCommand("cut");
        onClose();
      },
    },
    {
      id: "copy",
      label: "Copy",
      icon: <Copy className="size-4" />,
      shortcut: "⌘C",
      action: () => {
        document.execCommand("copy");
        onClose();
      },
    },
    {
      id: "paste",
      label: "Paste",
      icon: <ClipboardText className="size-4" />,
      shortcut: "⌘V",
      action: async () => {
        try {
          const text = await navigator.clipboard.readText();
          editor.chain().focus().insertContent(text).run();
        } catch {
          document.execCommand("paste");
        }
        onClose();
      },
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="size-4" />,
      action: () => {
        editor.chain().focus().deleteSelection().run();
        onClose();
      },
      divider: true,
    },

    // Undo/Redo
    {
      id: "undo",
      label: "Undo",
      icon: <ArrowCounterClockwise className="size-4" />,
      shortcut: "⌘Z",
      action: () => {
        editor.chain().focus().undo().run();
        onClose();
      },
      disabled: !editor.can().undo(),
    },
    {
      id: "redo",
      label: "Redo",
      icon: <ArrowClockwise className="size-4" />,
      shortcut: "⌘⇧Z",
      action: () => {
        editor.chain().focus().redo().run();
        onClose();
      },
      disabled: !editor.can().redo(),
      divider: true,
    },

    // Text formatting
    {
      id: "bold",
      label: "Bold",
      icon: <TextB className="size-4" />,
      shortcut: "⌘B",
      action: () => {
        editor.chain().focus().toggleBold().run();
        onClose();
      },
    },
    {
      id: "italic",
      label: "Italic",
      icon: <TextItalic className="size-4" />,
      shortcut: "⌘I",
      action: () => {
        editor.chain().focus().toggleItalic().run();
        onClose();
      },
    },
    {
      id: "underline",
      label: "Underline",
      icon: <TextUnderline className="size-4" />,
      shortcut: "⌘U",
      action: () => {
        editor.chain().focus().toggleUnderline().run();
        onClose();
      },
    },
    {
      id: "strikethrough",
      label: "Strikethrough",
      icon: <TextStrikethrough className="size-4" />,
      action: () => {
        editor.chain().focus().toggleStrike().run();
        onClose();
      },
    },
    {
      id: "code",
      label: "Inline Code",
      icon: <Code className="size-4" />,
      shortcut: "⌘E",
      action: () => {
        editor.chain().focus().toggleCode().run();
        onClose();
      },
    },
    {
      id: "highlight",
      label: "Highlight",
      icon: <Highlighter className="size-4" />,
      action: () => {
        editor.chain().focus().toggleHighlight().run();
        onClose();
      },
    },
    {
      id: "textColorBrand",
      label: "Text Color: Brand",
      icon: <Palette className="size-4" />,
      action: () => {
        editor.chain().focus().setColor("#5b4cdb").run();
        onClose();
      },
    },
    {
      id: "textColorEmerald",
      label: "Text Color: Emerald",
      icon: <Palette className="size-4" />,
      action: () => {
        editor.chain().focus().setColor("#10b981").run();
        onClose();
      },
    },
    {
      id: "textColorRose",
      label: "Text Color: Rose",
      icon: <Palette className="size-4" />,
      action: () => {
        editor.chain().focus().setColor("#f43f5e").run();
        onClose();
      },
    },
    {
      id: "textColorReset",
      label: "Text Color: Reset",
      icon: <Palette className="size-4" />,
      action: () => {
        editor.chain().focus().unsetColor().run();
        onClose();
      },
      divider: true,
    },

    // Block types
    {
      id: "paragraph",
      label: "Paragraph",
      icon: <Paragraph className="size-4" />,
      action: () => {
        editor.chain().focus().setParagraph().run();
        onClose();
      },
    },
    {
      id: "heading1",
      label: "Heading 1",
      icon: <TextHOne className="size-4" />,
      action: () => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        onClose();
      },
    },
    {
      id: "heading2",
      label: "Heading 2",
      icon: <TextHTwo className="size-4" />,
      action: () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        onClose();
      },
    },
    {
      id: "heading3",
      label: "Heading 3",
      icon: <TextHThree className="size-4" />,
      action: () => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        onClose();
      },
    },
    {
      id: "collapsible",
      label: "Collapsible Section",
      icon: <CaretRight className="size-4" />,
      action: () => {
        editor.chain().focus().setDetails().run();
        onClose();
      },
      divider: true,
    },

    // Lists
    {
      id: "bulletList",
      label: "Bullet List",
      icon: <ListBullets className="size-4" />,
      action: () => {
        editor.chain().focus().toggleBulletList().run();
        onClose();
      },
    },
    {
      id: "numberedList",
      label: "Numbered List",
      icon: <ListNumbers className="size-4" />,
      action: () => {
        editor.chain().focus().toggleOrderedList().run();
        onClose();
      },
    },
    {
      id: "taskList",
      label: "Task List",
      icon: <ListChecks className="size-4" />,
      action: () => {
        editor.chain().focus().toggleTaskList().run();
        onClose();
      },
    },
    {
      id: "blockquote",
      label: "Quote",
      icon: <Quotes className="size-4" />,
      action: () => {
        editor.chain().focus().toggleBlockquote().run();
        onClose();
      },
      divider: true,
    },

    // Alignment
    {
      id: "alignLeft",
      label: "Align Left",
      icon: <TextAlignLeft className="size-4" />,
      action: () => {
        editor.chain().focus().setTextAlign("left").run();
        onClose();
      },
    },
    {
      id: "alignCenter",
      label: "Align Center",
      icon: <TextAlignCenter className="size-4" />,
      action: () => {
        editor.chain().focus().setTextAlign("center").run();
        onClose();
      },
    },
    {
      id: "alignRight",
      label: "Align Right",
      icon: <TextAlignRight className="size-4" />,
      action: () => {
        editor.chain().focus().setTextAlign("right").run();
        onClose();
      },
      divider: true,
    },

    // Link
    {
      id: "link",
      label: editor.isActive("link") ? "Remove Link" : "Add Link",
      icon: editor.isActive("link") ? (
        <LinkBreak className="size-4" />
      ) : (
        <Link className="size-4" />
      ),
      action: () => {
        if (editor.isActive("link")) {
          editor.chain().focus().unsetLink().run();
        } else {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }
        onClose();
      },
    },
  ];

  const enabledItems = items.filter((item) => !item.disabled);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < enabledItems.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : enabledItems.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          enabledItems[selectedIndex]?.action();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, enabledItems, selectedIndex, onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Reset selection on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate position to keep menu in viewport
  const menuWidth = 220;
  const menuHeight = 500;
  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1000;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 800;

  const adjustedX =
    position.x + menuWidth > viewportWidth
      ? position.x - menuWidth
      : position.x;
  const adjustedY =
    position.y + menuHeight > viewportHeight
      ? Math.max(10, viewportHeight - menuHeight - 10)
      : position.y;

  let itemIndex = 0;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-modal animate-in fade-in-0 zoom-in-95 scrollbar-none"
      style={{
        top: adjustedY,
        left: adjustedX,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {items.map((item) => {
        const currentIndex = item.disabled ? -1 : itemIndex++;
        return (
          <div key={item.id}>
            <button
              onClick={item.action}
              disabled={item.disabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors",
                item.disabled
                  ? "text-muted-foreground opacity-50 cursor-not-allowed"
                  : currentIndex === selectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted",
              )}
            >
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-muted-foreground">
                  {item.shortcut}
                </span>
              )}
            </button>
            {item.divider && <div className="my-1 border-t border-border" />}
          </div>
        );
      })}
    </div>
  );
}
