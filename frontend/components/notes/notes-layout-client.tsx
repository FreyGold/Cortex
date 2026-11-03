"use client";

import { Menu as List, PanelLeft as SidebarSimple } from "lucide-react";
import { useEffect, useState } from "react";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { Button } from "@/components/ui/button";
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
    <div className="flex w-full h-screen overflow-hidden relative bg-background">
      {/* Sidebar Drawer */}
      <div
        className={cn(
          "transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] shrink-0 h-full bg-background border-r border-border/10 flex flex-col relative",
          isOpen
            ? "w-[280px] translate-x-0 opacity-100"
            : "w-0 -translate-x-full opacity-0 overflow-hidden",
          isMobile && "absolute z-40 shadow-2xl",
        )}
      >
        <div className="flex-1 overflow-hidden">
          <NotesSidebar onToggle={() => setIsOpen(false)} />
        </div>
      </div>

      {/* Toggle button when closed (floating) */}
      {!isOpen && (
        <div className="absolute top-12 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm shadow-sm border border-border/20 rounded-lg"
          >
            <SidebarSimple className="size-5" />
          </Button>
        </div>
      )}

      {isMobile && isOpen && (
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 min-h-0 h-full relative overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
