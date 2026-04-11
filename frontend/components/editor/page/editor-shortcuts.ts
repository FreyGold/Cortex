export interface EditorShortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

export const EDITOR_SHORTCUTS: EditorShortcut[] = [
  { id: "bold", key: "b", ctrl: true, description: "Bold" },
  { id: "italic", key: "i", ctrl: true, description: "Italic" },
  { id: "underline", key: "u", ctrl: true, description: "Underline" },
  { id: "inline-code", key: "e", ctrl: true, description: "Inline code" },
  { id: "highlight", key: "h", ctrl: true, shift: true, description: "Highlight" },
  { id: "strikethrough", key: "x", ctrl: true, shift: true, description: "Strikethrough" },
  { id: "heading-1", key: "1", ctrl: true, alt: true, description: "Heading 1" },
  { id: "heading-2", key: "2", ctrl: true, alt: true, description: "Heading 2" },
  { id: "heading-3", key: "3", ctrl: true, alt: true, description: "Heading 3" },
  { id: "bullet-list", key: ".", ctrl: true, shift: true, description: "Bullet list" },
  { id: "numbered-list", key: "/", ctrl: true, shift: true, description: "Numbered list" },
  { id: "task-list", key: "t", ctrl: true, shift: true, description: "Task list" },
  { id: "blockquote", key: "9", ctrl: true, shift: true, description: "Blockquote" },
  { id: "code-block", key: "`", ctrl: true, alt: true, description: "Code block" },
  { id: "horizontal-rule", key: "-", ctrl: true, description: "Horizontal rule" },
  { id: "undo", key: "z", ctrl: true, description: "Undo" },
  { id: "redo", key: "z", ctrl: true, shift: true, description: "Redo" },
];
