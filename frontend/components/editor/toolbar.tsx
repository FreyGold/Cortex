"use client";

import type { Editor } from "@tiptap/react";
import {
  Redo as ArrowClockwise,
  Undo as ArrowCounterClockwise,
  Bold,
  ChevronDown as CaretDown,
  ChevronRight as CaretRight,
  Code,
  SquareCode as CodeBlock,
  Highlighter,
  Image,
  Italic,
  Link,
  Unlink as LinkBreak,
  List,
  ListTodo as ListChecks,
  ListOrdered as ListNumbers,
  Minus,
  Palette,
  Type as Paragraph,
  Quote as Quotes,
  Strikethrough,
  Table,
  AlignCenter as TextAlignCenter,
  AlignJustify as TextAlignJustify,
  AlignLeft as TextAlignLeft,
  AlignRight as TextAlignRight,
  Heading1 as TextHOne,
  Heading3 as TextHThree,
  Heading2 as TextHTwo,
  Subscript as TextSubscript,
  Superscript as TextSuperscript,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  if (!editor) return null;

  const blockTypeOptions = [
    {
      label: "Paragraph",
      icon: <Paragraph className="size-4" />,
      action: () => editor.chain().focus().setParagraph().run(),
      isActive: editor.isActive("paragraph"),
    },
    {
      label: "Heading 1",
      icon: <TextHOne className="size-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "Heading 2",
      icon: <TextHTwo className="size-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Heading 3",
      icon: <TextHThree className="size-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
    {
      label: "Bullet List",
      icon: <List className="size-4" />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "Numbered List",
      icon: <ListNumbers className="size-4" />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "Task List",
      icon: <ListChecks className="size-4" />,
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: editor.isActive("taskList"),
    },
    {
      label: "Quote",
      icon: <Quotes className="size-4" />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
    {
      label: "Code Block",
      icon: <CodeBlock className="size-4" />,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
    },
    {
      label: "Collapsible",
      icon: <CaretRight className="size-4" />,
      action: () => editor.chain().focus().setDetails().run(),
      isActive: editor.isActive("details"),
    },
  ];

  const getCurrentBlockType = () => {
    const activeType = blockTypeOptions.find((opt) => opt.isActive);
    return activeType || blockTypeOptions[0];
  };

  const formatButtons: ToolbarButton[] = [
    {
      icon: <Bold className="size-4" />,
      label: "Bold",
      shortcut: "⌘B",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: <Italic className="size-4" />,
      label: "Italic",
      shortcut: "⌘I",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: <Underline className="size-4" />,
      label: "Underline",
      shortcut: "⌘U",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      icon: <Strikethrough className="size-4" />,
      label: "Strikethrough",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
    },
  ];

  const markButtons: ToolbarButton[] = [
    {
      icon: <Code className="size-4" />,
      label: "Inline Code",
      shortcut: "⌘E",
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
    },
    {
      icon: <Highlighter className="size-4" />,
      label: "Highlight",
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive("highlight"),
    },
    {
      icon: <TextSuperscript className="size-4" />,
      label: "Superscript",
      action: () => editor.chain().focus().toggleSuperscript().run(),
      isActive: editor.isActive("superscript"),
    },
    {
      icon: <TextSubscript className="size-4" />,
      label: "Subscript",
      action: () => editor.chain().focus().toggleSubscript().run(),
      isActive: editor.isActive("subscript"),
    },
  ];

  const textColors = [
    { label: "Default", value: null },
    { label: "Brand", value: "#5b4cdb" },
    { label: "Emerald", value: "#10b981" },
    { label: "Rose", value: "#f43f5e" },
    { label: "Amber", value: "#f59e0b" },
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
    {
      icon: <TextAlignJustify className="size-4" />,
      label: "Justify",
      action: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editor.isActive({ textAlign: "justify" }),
    },
  ];

  const insertButtons: ToolbarButton[] = [
    {
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
    },
    {
      icon: <Image className="size-4" />,
      label: "Insert Image",
      action: () => {
        const url = window.prompt("Enter image URL:");
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      },
    },
    {
      icon: <Table className="size-4" />,
      label: "Insert Table",
      action: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      icon: <Minus className="size-4" />,
      label: "Horizontal Rule",
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];

  const historyButtons: ToolbarButton[] = [
    {
      icon: <ArrowCounterClockwise className="size-4" />,
      label: "Undo",
      shortcut: "⌘Z",
      action: () => editor.chain().focus().undo().run(),
      disabled: !editor.can().undo(),
    },
    {
      icon: <ArrowClockwise className="size-4" />,
      label: "Redo",
      shortcut: "⌘⇧Z",
      action: () => editor.chain().focus().redo().run(),
      disabled: !editor.can().redo(),
    },
  ];

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
      <TooltipContent side="bottom" className="text-xs">
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

  const currentBlockType = getCurrentBlockType();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-card px-2 py-1.5",
        className,
      )}
    >
      {/* Block type dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs font-medium"
          >
            {currentBlockType.icon}
            <span className="hidden sm:inline">{currentBlockType.label}</span>
            <CaretDown className="size-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {blockTypeOptions.map((option, index) => (
            <div key={option.label}>
              <DropdownMenuItem
                onClick={option.action}
                className={cn(option.isActive && "bg-accent")}
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
              </DropdownMenuItem>
              {(index === 3 || index === 6) && <DropdownMenuSeparator />}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Format buttons */}
      {formatButtons.map(renderButton)}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Mark buttons */}
      {markButtons.map(renderButton)}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text color */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" className="h-7 w-7 rounded-sm">
            <Palette className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          {textColors.map((color) => (
            <DropdownMenuItem
              key={color.label}
              onClick={() => {
                if (color.value) {
                  editor.chain().focus().setColor(color.value).run();
                } else {
                  editor.chain().focus().unsetColor().run();
                }
              }}
            >
              <span
                className="mr-2 h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: color.value ?? "transparent" }}
              />
              {color.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Alignment buttons */}
      <div className="hidden sm:flex items-center gap-0.5">
        {alignButtons.map(renderButton)}
        <Separator orientation="vertical" className="mx-1 h-6" />
      </div>

      {/* Insert buttons */}
      {insertButtons.map(renderButton)}

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* History buttons */}
      {historyButtons.map(renderButton)}
    </div>
  );
}
