import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";

declare module "@tiptap/extension-drag-handle" {
  interface DragHandleOptions {
    onNodeChange?: (options: {
      node: Node | null;
      editor: Editor;
      pos?: number;
    }) => void;
  }
}
