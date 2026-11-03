"use client";

import { DndPlugin } from "@platejs/dnd";
import { PlaceholderPlugin } from "@platejs/media/react";
import { createDragDropManager } from "dnd-core";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { BlockDraggable } from "@/components/ui/block-draggable";

// Create a single manager instance on the client to avoid "two HTML5 backends"
// when navigating quickly between editor instances.
let manager: any = null;

function SafeDndProvider({ children }: { children: React.ReactNode }) {
  // Synchronously initialize the manager on the client to ensure children
  // always have a drag-and-drop context.
  if (typeof window !== "undefined" && !manager) {
    manager = createDragDropManager(HTML5Backend);
  }

  if (manager) {
    return <DndProvider manager={manager}>{children}</DndProvider>;
  }

  // Fallback for SSR where window is undefined.
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
}

export const DndKit = [
  DndPlugin.configure({
    options: {
      enableScroller: true,
      onDropFiles: ({ dragItem, editor, target }) => {
        editor
          .getTransforms(PlaceholderPlugin)
          .insert.media(dragItem.files, { at: target, nextBlock: false });
      },
    },
    render: {
      aboveNodes: BlockDraggable,
      aboveSlate: ({ children }) => (
        <SafeDndProvider>{children}</SafeDndProvider>
      ),
    },
  }),
];
