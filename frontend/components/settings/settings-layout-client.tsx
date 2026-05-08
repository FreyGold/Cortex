"use client";

import { useState, useEffect } from "react";
import { PanelLeft as SidebarSimple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppSidebar } from "../app-sidebar";

export function SettingsLayoutClient({ children }: { children: React.ReactNode }) {
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
      {/* Main Sidebar with Configuration tabs */}
      <AppSidebar 
        isOpen={isOpen} 
        onToggle={() => setIsOpen(!isOpen)} 
      />

      {/* Toggle button when closed (floating) */}
      {!isOpen && (
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-md shadow-xl border border-border/10 rounded-xl"
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

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 min-h-0 h-full relative overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
