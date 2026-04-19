"use client";

import { useState, useEffect } from "react";
import { SidebarSimple, List } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { cn } from "@/lib/utils";

export function NotesLayoutClient({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex w-full h-full relative bg-background">
      {/* Mobile overlay toggle */}
      {isMobile && !isOpen && (
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background shadow-sm"
          >
            <List className="size-4" />
          </Button>
        </div>
      )}

      {/* Desktop toggle button when closed */}
      {!isMobile && !isOpen && (
        <div className="absolute top-4 left-2 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <SidebarSimple className="size-5" />
          </Button>
        </div>
      )}

      {/* Sidebar Drawer */}
      <div
        className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] shrink-0 h-full bg-background border-r border-border/20 flex flex-col",
          isOpen
            ? "w-[280px] translate-x-0 opacity-100"
            : "w-0 -translate-x-full opacity-0",
          isMobile ? "absolute z-40 shadow-2xl bg-background" : "relative",
        )}
      >
        <div className="flex w-[280px] shrink-0 justify-between items-center px-4 py-3 border-b border-border/10">
          <span className="text-sm font-semibold tracking-tight text-foreground/80">
            Cortex Workspace
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <SidebarSimple className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 custom-scrollbar">
          <div className="w-full pb-10">
            <NotesSidebar />
          </div>
        </div>
      </div>

      {isMobile && isOpen && (
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-w-0 min-h-0 h-full transition-all duration-300",
          !isOpen && !isMobile ? "pl-14 lg:pl-16" : "",
        )}
      >
        <div className="w-full h-full min-h-0 flex flex-col">{children}</div>
      </main>
    </div>
  );
}
