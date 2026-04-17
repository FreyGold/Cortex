"use client";

import {
  Code,
  CodeBlock,
  Highlighter,
  Image,
  Link,
  ListBullets,
  ListChecks,
  ListNumbers,
  Minus,
  Palette,
  Quotes,
  Table,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextHOne,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
  TextSubscript,
  TextSuperscript,
  TextUnderline,
} from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";

export interface SlashCommand {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  action: (editor: Editor) => void;
}

export const slashCommands: SlashCommand[] = [
  // Text formatting
  {
    id: "heading1",
    title: "Heading 1",
    description: "Big section heading",
    icon: <TextHOne className="size-4" />,
    category: "Headings",
    keywords: ["h1", "heading", "title", "big"],
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: "heading2",
    title: "Heading 2",
    description: "Medium section heading",
    icon: <TextHTwo className="size-4" />,
    category: "Headings",
    keywords: ["h2", "heading", "subtitle"],
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    title: "Heading 3",
    description: "Small section heading",
    icon: <TextHThree className="size-4" />,
    category: "Headings",
    keywords: ["h3", "heading", "small"],
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },

  // Lists
  {
    id: "bulletList",
    title: "Bullet List",
    description: "Create a bulleted list",
    icon: <ListBullets className="size-4" />,
    category: "Lists",
    keywords: ["ul", "bullet", "list", "unordered"],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "numberedList",
    title: "Numbered List",
    description: "Create a numbered list",
    icon: <ListNumbers className="size-4" />,
    category: "Lists",
    keywords: ["ol", "numbered", "list", "ordered"],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "taskList",
    title: "Task List",
    description: "Create a todo list with checkboxes",
    icon: <ListChecks className="size-4" />,
    category: "Lists",
    keywords: ["todo", "task", "checkbox", "checklist"],
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },

  // Text styles
  {
    id: "bold",
    title: "Bold",
    description: "Make text bold",
    icon: <TextB className="size-4" weight="bold" />,
    category: "Formatting",
    keywords: ["bold", "strong", "b"],
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    title: "Italic",
    description: "Make text italic",
    icon: <TextItalic className="size-4" />,
    category: "Formatting",
    keywords: ["italic", "em", "i"],
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "underline",
    title: "Underline",
    description: "Underline text",
    icon: <TextUnderline className="size-4" />,
    category: "Formatting",
    keywords: ["underline", "u"],
    action: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    id: "strikethrough",
    title: "Strikethrough",
    description: "Cross out text",
    icon: <TextStrikethrough className="size-4" />,
    category: "Formatting",
    keywords: ["strike", "strikethrough", "s", "del"],
    action: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "code",
    title: "Inline Code",
    description: "Mark as inline code",
    icon: <Code className="size-4" />,
    category: "Formatting",
    keywords: ["code", "inline", "mono"],
    action: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    id: "highlight",
    title: "Highlight",
    description: "Highlight text with color",
    icon: <Highlighter className="size-4" />,
    category: "Formatting",
    keywords: ["highlight", "mark", "bg", "background"],
    action: (editor) => editor.chain().focus().toggleHighlight().run(),
  },
  {
    id: "textColorBrand",
    title: "Text Color: Brand",
    description: "Apply brand indigo color",
    icon: <Palette className="size-4" />,
    category: "Formatting",
    keywords: ["color", "text", "brand", "indigo"],
    action: (editor) => editor.chain().focus().setColor("#5b4cdb").run(),
  },
  {
    id: "textColorEmerald",
    title: "Text Color: Emerald",
    description: "Apply emerald color",
    icon: <Palette className="size-4" />,
    category: "Formatting",
    keywords: ["color", "text", "green", "emerald"],
    action: (editor) => editor.chain().focus().setColor("#10b981").run(),
  },
  {
    id: "textColorRose",
    title: "Text Color: Rose",
    description: "Apply rose color",
    icon: <Palette className="size-4" />,
    category: "Formatting",
    keywords: ["color", "text", "rose", "red"],
    action: (editor) => editor.chain().focus().setColor("#f43f5e").run(),
  },
  {
    id: "textColorReset",
    title: "Text Color: Reset",
    description: "Remove text color",
    icon: <Palette className="size-4" />,
    category: "Formatting",
    keywords: ["color", "text", "reset", "default"],
    action: (editor) => editor.chain().focus().unsetColor().run(),
  },
  {
    id: "superscript",
    title: "Superscript",
    description: "Make text superscript",
    icon: <TextSuperscript className="size-4" />,
    category: "Formatting",
    keywords: ["super", "superscript", "sup"],
    action: (editor) => editor.chain().focus().toggleSuperscript().run(),
  },
  {
    id: "subscript",
    title: "Subscript",
    description: "Make text subscript",
    icon: <TextSubscript className="size-4" />,
    category: "Formatting",
    keywords: ["sub", "subscript"],
    action: (editor) => editor.chain().focus().toggleSubscript().run(),
  },

  // Blocks
  {
    id: "blockquote",
    title: "Quote",
    description: "Create a blockquote",
    icon: <Quotes className="size-4" />,
    category: "Blocks",
    keywords: ["quote", "blockquote", "cite"],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "codeBlock",
    title: "Code Block",
    description: "Add a code block with syntax highlighting",
    icon: <CodeBlock className="size-4" />,
    category: "Blocks",
    keywords: ["code", "block", "pre", "syntax"],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "divider",
    title: "Divider",
    description: "Insert a horizontal divider",
    icon: <Minus className="size-4" />,
    category: "Blocks",
    keywords: ["divider", "hr", "line", "separator"],
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "table",
    title: "Table",
    description: "Insert a table",
    icon: <Table className="size-4" />,
    category: "Blocks",
    keywords: ["table", "grid", "data"],
    action: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    id: "collapsible",
    title: "Collapsible Section",
    description: "Insert a details/summary block",
    icon: <Quotes className="size-4" />,
    category: "Blocks",
    keywords: ["details", "summary", "collapsible", "toggle"],
    action: (editor) => editor.chain().focus().setDetails().run(),
  },

  // Alignment
  {
    id: "alignLeft",
    title: "Align Left",
    description: "Align text to the left",
    icon: <TextAlignLeft className="size-4" />,
    category: "Alignment",
    keywords: ["align", "left"],
    action: (editor) => editor.chain().focus().setTextAlign("left").run(),
  },
  {
    id: "alignCenter",
    title: "Align Center",
    description: "Center align text",
    icon: <TextAlignCenter className="size-4" />,
    category: "Alignment",
    keywords: ["align", "center", "middle"],
    action: (editor) => editor.chain().focus().setTextAlign("center").run(),
  },
  {
    id: "alignRight",
    title: "Align Right",
    description: "Align text to the right",
    icon: <TextAlignRight className="size-4" />,
    category: "Alignment",
    keywords: ["align", "right"],
    action: (editor) => editor.chain().focus().setTextAlign("right").run(),
  },

  // Media
  {
    id: "link",
    title: "Link",
    description: "Insert a hyperlink",
    icon: <Link className="size-4" />,
    category: "Media",
    keywords: ["link", "url", "href", "a"],
    action: (editor) => {
      const url = window.prompt("Enter URL:");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    },
  },
  {
    id: "image",
    title: "Image",
    description: "Insert an image from URL",
    icon: <Image className="size-4" />,
    category: "Media",
    keywords: ["image", "img", "picture", "photo"],
    action: (editor) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
];

export function filterCommands(
  commands: SlashCommand[],
  query: string,
): SlashCommand[] {
  if (!query) return commands;
  const lowerQuery = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some((k) => k.includes(lowerQuery)),
  );
}

export function groupCommandsByCategory(
  commands: SlashCommand[],
): Record<string, SlashCommand[]> {
  return commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, SlashCommand[]>,
  );
}
