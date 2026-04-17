"use client";

import { cn } from "@/lib/utils";

interface SelectionIndicatorProps {
  isSelected: boolean;
  className?: string;
}

export function SelectionIndicator({
  isSelected,
  className,
}: SelectionIndicatorProps) {
  return (
    <span
      className={cn(
        "size-1.5 rounded-full transition-all",
        isSelected ? "bg-primary scale-100" : "bg-transparent scale-0",
        className,
      )}
    />
  );
}

interface SelectedRowProps {
  isSelected: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

export function SelectedRow({
  isSelected,
  children,
  className,
  onClick,
  onMouseEnter,
}: SelectedRowProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-md cursor-pointer transition-colors",
        isSelected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted",
        className,
      )}
    >
      {children}
    </div>
  );
}
