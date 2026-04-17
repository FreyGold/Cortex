"use client";

import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  filterCommands,
  groupCommandsByCategory,
  type SlashCommand,
  slashCommands,
} from "./slash-commands";

interface SlashCommandMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

export function SlashCommandMenu({
  editor,
  isOpen,
  onClose,
  position,
}: SlashCommandMenuProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredCommands = filterCommands(slashCommands, query);
  const groupedCommands = groupCommandsByCategory(filteredCommands);
  const flatCommands = filteredCommands;

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      // Delete the "/" trigger and query
      editor
        .chain()
        .focus()
        .deleteRange({
          from: editor.state.selection.from - query.length - 1,
          to: editor.state.selection.from,
        })
        .run();

      command.action(editor);
      onClose();
      setQuery("");
      setSelectedIndex(0);
    },
    [editor, query, onClose],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < flatCommands.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : flatCommands.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (flatCommands[selectedIndex]) {
            executeCommand(flatCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          setQuery("");
          setSelectedIndex(0);
          break;
        case "Backspace":
          if (query.length === 0) {
            onClose();
          } else {
            setQuery((prev) => prev.slice(0, -1));
            setSelectedIndex(0);
          }
          break;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            setQuery((prev) => prev + e.key);
            setSelectedIndex(0);
          }
      }
    },
    [isOpen, flatCommands, selectedIndex, executeCommand, onClose, query],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
    }
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current && isOpen) {
      const selectedEl = menuRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  const categories = Object.keys(groupedCommands);

  let globalIndex = 0;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-modal animate-in fade-in-0 zoom-in-95 scrollbar-none"
      style={{
        top: position.top + 24,
        left: position.left,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {query && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
          Searching:{" "}
          <span className="font-medium text-foreground">{query}</span>
        </div>
      )}

      {flatCommands.length === 0 ? (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          No commands found
        </div>
      ) : (
        <div className="py-1">
          {categories.map((category) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              {groupedCommands[category].map((command) => {
                const currentIndex = globalIndex++;
                return (
                  <button
                    key={command.id}
                    data-index={currentIndex}
                    onClick={() => executeCommand(command)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      currentIndex === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                      {command.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {command.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {command.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground flex items-center gap-4">
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
            ↑↓
          </kbd>{" "}
          Navigate
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
            ↵
          </kbd>{" "}
          Select
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
            Esc
          </kbd>{" "}
          Close
        </span>
      </div>
    </div>
  );
}
