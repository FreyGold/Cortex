"use client";

import { exportToDocx } from "@platejs/docx-io";
import { MarkdownPlugin } from "@platejs/markdown";
import type { DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { ArrowDownToLineIcon } from "lucide-react";
import type { SlatePlugin } from "platejs";
import { createSlateEditor } from "platejs";
import { useEditorRef } from "platejs/react";
import { serializeHtml } from "platejs/static";
import * as React from "react";
import { BaseEditorKit } from "@/components/editor/editor-base-kit";
import { DocxExportKit } from "@/components/editor/plugins/docx-export-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditorStatic } from "./editor-static";
import { ToolbarButton } from "./toolbar";

const siteUrl = "https://platejs.org";

export function ExportToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const getCanvas = async () => {
    const { default: html2canvas } = await import("html2canvas-pro");

    const style = document.createElement("style");
    document.head.append(style);

    const domNode = editor.api.toDOMNode(editor);
    if (!domNode) {
      throw new Error("Could not find editor DOM node");
    }

    const canvas = await html2canvas(domNode, {
      onclone: (document: Document) => {
        const editorElement = document.querySelector(
          '[contenteditable="true"]',
        );
        if (editorElement) {
          Array.from(editorElement.querySelectorAll("*")).forEach((element) => {
            const existingStyle = element.getAttribute("style") || "";
            element.setAttribute(
              "style",
              `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`,
            );
          });
        }
      },
    });
    style.remove();

    return canvas;
  };

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  };

  const exportToPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { default: ReactMarkdown } = await import("react-markdown");
    const { default: remarkGfm } = await import("remark-gfm");
    const { default: remarkMath } = await import("remark-math");
    const { default: rehypeKatex } = await import("rehype-katex");

    // 1. Get Markdown string from the editor
    const md = editor.getApi(MarkdownPlugin).markdown.serialize();

    // 2. Convert Markdown to HTML
    const renderedHtml = renderToStaticMarkup(
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {md}
      </ReactMarkdown>,
    );

    const tailwindCss = `<link rel="stylesheet" href="${siteUrl}/tailwind.css">`;
    const katexCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.18/dist/katex.css" integrity="sha384-9PvLvaiSKCPkFKB1ZsEoTjgnJn+O3KvEwtsz37/XrkYft3DTk2gHdYvd9oWgW3tV" crossorigin="anonymous">`;

    // 3. Prepare printable container
    const container = document.createElement("div");
    container.style.width = "800px";
    container.style.background = "white";
    container.style.position = "absolute";
    container.style.left = "-9999px"; // Hide it from the user
    container.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${tailwindCss}
          ${katexCss}
          <style>
            .markdown-body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6; 
              color: #333; 
              font-size: 14px;
            }
            h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
            h1 { font-size: 2em; } h2 { font-size: 1.5em; } h3 { font-size: 1.25em; }
            p { margin-bottom: 1em; }
            ul, ol { margin-bottom: 1em; padding-left: 2em; }
            li { margin-bottom: 0.25em; }
            pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 1em; }
            code { font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace; background: rgba(175,184,193,0.2); padding: 0.2em 0.4em; border-radius: 6px; font-size: 85%; }
            pre code { background: transparent; padding: 0; }
            blockquote { padding: 0 1em; color: #656d76; border-left: 0.25em solid #d0d7de; margin-bottom: 1em; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
            th, td { border: 1px solid #d0d7de; padding: 6px 13px; text-align: left; }
            th { font-weight: 600; background-color: #f6f8fa; }
          </style>
        </head>
        <body class="markdown-body">
          ${renderedHtml}
        </body>
      </html>
    `;
    document.body.appendChild(container);

    // 4. Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      hotfixes: ["px_total_page_v2"],
    });

    await doc.html(container, {
      callback: (doc) => {
        doc.save("note.pdf");
        document.body.removeChild(container);
      },
      margin: [15, 15, 15, 15],
      autoPaging: "text",
      x: 0,
      y: 0,
      width: 180,
      windowWidth: 800,
    });
  };

  const exportToImage = async () => {
    const canvas = await getCanvas();
    await downloadFile(canvas.toDataURL("image/png"), "plate.png");
  };

  const exportToHtml = async () => {
    const editorStatic = createSlateEditor({
      plugins: BaseEditorKit,
      value: editor.children,
    });

    const editorHtml = await serializeHtml(editorStatic, {
      editorComponent: EditorStatic,
      props: { style: { padding: "0 calc(50% - 350px)", paddingBottom: "" } },
    });

    const tailwindCss = `<link rel="stylesheet" href="${siteUrl}/tailwind.css">`;
    const katexCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.18/dist/katex.css" integrity="sha384-9PvLvaiSKCPkFKB1ZsEoTjgnJn+O3KvEwtsz37/XrkYft3DTk2gHdYvd9oWgW3tV" crossorigin="anonymous">`;

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
        ${tailwindCss}
        ${katexCss}
        <style>
          :root {
            --font-sans: 'Inter', 'Inter Fallback';
            --font-mono: 'JetBrains Mono', 'JetBrains Mono Fallback';
          }
        </style>
      </head>
      <body>
        ${editorHtml}
      </body>
    </html>`;

    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    await downloadFile(url, "plate.html");
  };

  const exportToMarkdown = async () => {
    const md = editor.getApi(MarkdownPlugin).markdown.serialize();
    const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
    await downloadFile(url, "plate.md");
  };

  const exportToWord = async () => {
    const blob = await exportToDocx(editor.children, {
      editorPlugins: [...BaseEditorKit, ...DocxExportKit] as SlatePlugin[],
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plate.docx";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Export" isDropdown>
          <ArrowDownToLineIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={exportToHtml}>
            Export as HTML
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToPdf}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToImage}>
            Export as Image
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToMarkdown}>
            Export as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToWord}>
            Export as Word
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
