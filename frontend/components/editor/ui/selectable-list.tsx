"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MenuItemBase {
  id: string;
  disabled?: boolean;
}

interface SelectableListProps<T extends MenuItemBase> {
  items: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onExecute: (item: T) => void;
  renderItem: (item: T, isSelected: boolean, index: number) => ReactNode;
  className?: string;
  itemClassName?: string;
}

export function SelectableList<T extends MenuItemBase>({
  items,
  selectedIndex,
  onSelect,
  onExecute,
  renderItem,
  className,
  itemClassName,
}: SelectableListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!containerRef.current) return;
    const selectedEl = containerRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div ref={containerRef} className={className}>
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <div
            key={item.id}
            data-index={index}
            onMouseEnter={() => !item.disabled && onSelect(index)}
            onClick={() => !item.disabled && onExecute(item)}
            className={cn(
              "cursor-pointer transition-colors",
              item.disabled && "opacity-50 cursor-not-allowed",
              itemClassName
            )}
          >
            {renderItem(item, isSelected, index)}
          </div>
        );
      })}
    </div>
  );
}

interface UseKeyboardNavigationOptions {
  itemCount: number;
  isOpen: boolean;
  onSelect: (index: number) => void;
  onExecute: () => void;
  onClose: () => void;
}

export function useKeyboardNavigation({
  itemCount,
  isOpen,
  onSelect,
  onExecute,
  onClose,
}: UseKeyboardNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % itemCount);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case "Enter":
          e.preventDefault();
          onExecute();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, itemCount, onExecute, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
    }
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    onSelect(selectedIndex);
  }, [selectedIndex, onSelect]);

  const reset = useCallback(() => setSelectedIndex(0), []);

  return { selectedIndex, setSelectedIndex, reset };
}
