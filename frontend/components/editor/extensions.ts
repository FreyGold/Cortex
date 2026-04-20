"use client";

import { GripVertical as DotsSixVertical } from "lucide-react";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from "@tiptap/extension-details";
import DragHandle from "@tiptap/extension-drag-handle";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import NodeRange from "@tiptap/extension-node-range";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { createElement } from "react";
import { createRoot } from "react-dom/client";

const lowlight = createLowlight(common);
const nestedDragRules = [
  {
    id: "excludeInline",
    evaluate: ({ node }: { node: { isInline: boolean; isText: boolean } }) =>
      node.isInline || node.isText ? 1000 : 0,
  },
];

export const editorExtensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
    codeBlock: false, // We use CodeBlockLowlight instead
    link: false,
    underline: false,
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return "Untitled";
      }
      return 'Type "/" for commands...';
    },
  }),
  Highlight.configure({
    multicolor: true,
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class:
        "text-brand-text underline underline-offset-4 hover:text-brand cursor-pointer",
    },
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
    HTMLAttributes: {
      class: "rounded-lg max-w-full h-auto my-4",
    },
  }),
  Underline,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  TextStyle,
  Color,
  NodeRange,
  DragHandle.configure({
    render() {
      const element = document.createElement("div");
      element.classList.add("drag-handle", "drag-handle-wrapper");

      const dragButton = document.createElement("button");
      dragButton.classList.add("drag-handle-drag");
      dragButton.type = "button";

      const root = createRoot(dragButton);
      root.render(
        createElement(DotsSixVertical, {
          className: "size-4",
        }),
      );

      element.appendChild(dragButton);
      return element;
    },
    nested: {
      defaultRules: false,
      rules: nestedDragRules,
      edgeDetection: "none",
    },
  }),
  Details.configure({
    openClassName: "is-open",
    HTMLAttributes: {
      class: "details-node",
    },
    renderToggleButton: ({ element, isOpen, node }) => {
      element.classList.add("details-toggle");
      element.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>';
    },
  }),
  DetailsSummary,
  DetailsContent,
  Typography,
  Subscript,
  Superscript,
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: "bg-muted rounded-lg p-4 my-4 font-mono text-sm overflow-x-auto",
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: "border-collapse table-auto w-full my-4",
    },
  }),
  TableRow.configure({
    HTMLAttributes: {
      class: "border-b border-border",
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: "border border-border bg-muted p-2 font-semibold text-left",
    },
  }),
  TableCell.configure({
    HTMLAttributes: {
      class: "border border-border p-2",
    },
  }),
];
