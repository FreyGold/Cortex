"use client";

import {
  Code,
  Highlighter,
  Link,
  LinkBreak,
  ListBullets,
  ListNumbers,
  Quotes,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BubbleMenuContentProps {
  editor: Editor;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export function BubbleMenuContent({ editor }: BubbleMenuContentProps) {
  const formatButtons: ToolbarButton[] = [
    {
      icon: <TextB className="size-4" weight="bold" />,
      label: "Bold",
      shortcut: "⌘B",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: <TextItalic className="size-4" />,
      label: "Italic",
      shortcut: "⌘I",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: <TextUnderline className="size-4" />,
      label: "Underline",
      shortcut: "⌘U",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      icon: <TextStrikethrough className="size-4" />,
      label: "Strikethrough",
      shortcut: "⌘⇧X",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
    {
      icon: <Code className="size-4" />,
      label: "Code",
      shortcut: "⌘E",
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
    },
    {
      icon: <Highlighter className="size-4" />,
      label: "Highlight",
      shortcut: "⌘⇧H",
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive("highlight"),
    },
  ];

  const listButtons: ToolbarButton[] = [
    {
      icon: <ListBullets className="size-4" />,
      label: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      icon: <ListNumbers className="size-4" />,
      label: "Numbered List",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      icon: <Quotes className="size-4" />,
      label: "Quote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
  ];

  const alignButtons: ToolbarButton[] = [
    {
      icon: <TextAlignLeft className="size-4" />,
      label: "Align Left",
      action: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
    },
    {
      icon: <TextAlignCenter className="size-4" />,
      label: "Align Center",
      action: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
    },
    {
      icon: <TextAlignRight className="size-4" />,
      label: "Align Right",
      action: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
    },
  ];

  const linkButton: ToolbarButton = {
    icon: editor.isActive("link") ? (
      <LinkBreak className="size-4" />
    ) : (
      <Link className="size-4" />
    ),
    label: editor.isActive("link") ? "Remove Link" : "Add Link",
    action: () => {
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
      } else {
        const url = window.prompt("Enter URL:");
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }
    },
    isActive: editor.isActive("link"),
  };

  const renderButton = (button: ToolbarButton) => (
    <Tooltip key={button.label}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={button.action}
          disabled={button.disabled}
          className={cn(
            "h-7 w-7 rounded-sm",
            button.isActive && "bg-accent text-accent-foreground",
          )}
        >
          {button.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p>
          {button.label}
          {button.shortcut && (
            <span className="ml-2 text-muted-foreground">
              {button.shortcut}
            </span>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover px-1 py-0.5 shadow-modal">
      {formatButtons.map(renderButton)}
      <Separator orientation="vertical" className="mx-1 h-6" />
      {listButtons.map(renderButton)}
      <Separator orientation="vertical" className="mx-1 h-6" />
      {alignButtons.map(renderButton)}
      <Separator orientation="vertical" className="mx-1 h-6" />
      {renderButton(linkButton)}
    </div>
  );
}
