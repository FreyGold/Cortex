"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  children: ReactNode;
  className?: string;
  offset?: { x?: number; y?: number };
}

export function FloatingMenu({
  isOpen,
  position,
  children,
  className,
  offset = { x: 0, y: 0 },
}: FloatingMenuProps) {
  if (!isOpen) return null;

  // Calculate viewport-aware position
  const menuWidth = 224; // w-56 = 14rem = 224px
  const menuHeight = 400; // approximate max height
  const padding = 10;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1080;

  let adjustedX = position.x + (offset.x ?? 0);
  let adjustedY = position.y + (offset.y ?? 0);

  // Adjust if menu would overflow right edge
  if (adjustedX + menuWidth > viewportWidth - padding) {
    adjustedX = Math.max(padding, viewportWidth - menuWidth - padding);
  }

  // Adjust if menu would overflow bottom edge
  if (adjustedY + menuHeight > viewportHeight - padding) {
    adjustedY = Math.max(padding, viewportHeight - menuHeight - padding);
  }

  return (
    <div
      className={cn(
        "fixed z-50 rounded-lg border border-border bg-popover shadow-modal",
        "animate-in fade-in-0 zoom-in-95 scrollbar-none",
        className
      )}
      style={{
        top: adjustedY,
        left: adjustedX,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {children}
    </div>
  );
}

interface MenuSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function MenuSection({ title, children, className }: MenuSectionProps) {
  return (
    <div className={className}>
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

export function MenuItem({
  icon,
  label,
  description,
  shortcut,
  isSelected = false,
  isDisabled = false,
  onClick,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
        isDisabled
          ? "text-muted-foreground opacity-50 cursor-not-allowed"
          : isSelected
            ? "bg-accent text-accent-foreground"
            : "hover:bg-muted"
      )}
    >
      {icon && (
        <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0 text-muted-foreground">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground truncate">
            {description}
          </div>
        )}
      </div>
      {shortcut && (
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

interface MenuFooterProps {
  children: ReactNode;
  className?: string;
}

export function MenuFooter({ children, className }: MenuFooterProps) {
  return (
    <div
      className={cn(
        "px-3 py-2 border-t border-border text-xs text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
