"use client";

import { AIChatPlugin } from "@platejs/ai/react";
import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
} from "@platejs/selection/react";
import { ClipboardPaste, Copy, MessageSquarePlus } from "lucide-react";
import { KEYS } from "platejs";
import {
  useEditorPlugin,
  useEditorReadOnly,
  usePluginOption,
} from "platejs/react";
import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useIsTouchDevice } from "@/hooks/use-is-touch-device";

type Value = "askAI" | null;

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const [value, setValue] = React.useState<Value>(null);
  const isTouch = useIsTouchDevice();
  const readOnly = useEditorReadOnly();
  const openId = usePluginOption(BlockMenuPlugin, "openId");
  const isOpen = openId === BLOCK_CONTEXT_MENU_ID;

  const handleTurnInto = React.useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([node, path]) => {
          if (node[KEYS.listType]) {
            editor.tf.unsetNodes([KEYS.listType, "indent"], {
              at: path,
            });
          }

          editor.tf.toggleBlock(type, { at: path });
        });
    },
    [editor],
  );

  const handleAlign = React.useCallback(
    (align: "center" | "left" | "right") => {
      editor
        .getTransforms(BlockSelectionPlugin)
        .blockSelection.setNodes({ align });
    },
    [editor],
  );

  if (isTouch) {
    return children;
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide();
        }
      }}
      modal={false}
    >
      <ContextMenuTrigger
        asChild
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset;
          const disabled = dataset?.plateOpenContextMenu === "false";

          if (disabled) return event.preventDefault();

          setTimeout(() => {
            api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
              x: event.clientX,
              y: event.clientY,
            });
          }, 0);
        }}
      >
        <div className="w-full">{children}</div>
      </ContextMenuTrigger>

      <ContextMenuContent
        className="w-64"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          try {
            editor.getApi(BlockSelectionPlugin).blockSelection?.focus?.();
          } catch (err) {}

          if (value === "askAI") {
            editor.getApi(AIChatPlugin).aiChat?.show?.();
          }

          setValue(null);
        }}
      >
        <ContextMenuGroup>
          <ContextMenuItem
            className="gap-2 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              document.execCommand("copy");
            }}
          >
            <Copy className="size-4 text-muted-foreground" />
            <span>Copy</span>
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>

          {!readOnly && (
            <ContextMenuItem
              className="gap-2 cursor-pointer"
              onSelect={async (e) => {
                e.preventDefault();
                try {
                  const text = await navigator.clipboard.readText();
                  document.execCommand("insertText", false, text);
                } catch (e) {
                  console.error("Failed to paste", e);
                }
              }}
            >
              <ClipboardPaste className="size-4 text-muted-foreground" />
              <span>Paste</span>
              <ContextMenuShortcut>⌘V</ContextMenuShortcut>
            </ContextMenuItem>
          )}

          <ContextMenuItem
            className="gap-2 cursor-pointer text-primary font-semibold"
            onSelect={(e) => {
              e.preventDefault();
              if (readOnly) {
                const selection = window.getSelection();
                window.dispatchEvent(
                  new CustomEvent("add-note-comment", {
                    detail: { text: selection?.toString() },
                  }),
                );
                return;
              }
              try {
                // Trigger Plate built-in commenting system
                (editor.tf as any).comment?.setDraft?.();
              } catch (err) {
                console.error("Failed to trigger built-in comment:", err);
              }
            }}
          >
            <MessageSquarePlus className="size-4" />
            <span>Comment on Selection</span>
            <ContextMenuShortcut>⌘⇧M</ContextMenuShortcut>
          </ContextMenuItem>

          <ContextMenuItem
            className="gap-2 cursor-pointer text-muted-foreground"
            onSelect={(e) => {
              e.preventDefault();
              window.dispatchEvent(
                new CustomEvent("add-note-comment", {
                  detail: { text: null },
                }),
              );
            }}
          >
            <MessageSquarePlus className="size-4" />
            <span>Go to Discussions</span>
          </ContextMenuItem>
        </ContextMenuGroup>

        {isOpen && !readOnly && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() => {
                  setValue("askAI");
                }}
              >
                Ask AI
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  editor
                    .getTransforms(BlockSelectionPlugin)
                    .blockSelection.removeNodes();
                  editor.tf.focus();
                }}
              >
                Delete
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  editor
                    .getTransforms(BlockSelectionPlugin)
                    .blockSelection.duplicate();
                }}
              >
                Duplicate
                {/* <ContextMenuShortcut>⌘ + D</ContextMenuShortcut> */}
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>Turn into</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={() => handleTurnInto(KEYS.p)}>
                    Paragraph
                  </ContextMenuItem>

                  <ContextMenuItem onClick={() => handleTurnInto(KEYS.h1)}>
                    Heading 1
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTurnInto(KEYS.h2)}>
                    Heading 2
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleTurnInto(KEYS.h3)}>
                    Heading 3
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleTurnInto(KEYS.blockquote)}
                  >
                    Blockquote
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleTurnInto(KEYS.codeDrawing)}
                  >
                    Code Drawing
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuGroup>

            <ContextMenuGroup>
              <ContextMenuItem
                onClick={() =>
                  editor
                    .getTransforms(BlockSelectionPlugin)
                    .blockSelection.setIndent(1)
                }
              >
                Indent
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  editor
                    .getTransforms(BlockSelectionPlugin)
                    .blockSelection.setIndent(-1)
                }
              >
                Outdent
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>Align</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={() => handleAlign("left")}>
                    Left
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAlign("center")}>
                    Center
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAlign("right")}>
                    Right
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
