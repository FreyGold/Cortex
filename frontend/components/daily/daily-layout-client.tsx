"use client";

import { useState, useEffect } from "react";
import { PanelLeft as SidebarSimple, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppSidebar } from "../app-sidebar";
import { DailyAssistant } from "./views/daily-assistant";
import { DailyStats } from "./views/daily-stats";
import { DailyHabits } from "./views/daily-habits";
import { DailySearch } from "./views/daily-search";

export function DailyLayoutClient({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === "assistant") {
      setIsAssistantOpen(!isAssistantOpen);
    } else {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "calendar":
        return children;
      case "stats":
        return <DailyStats />;
      case "habits":
        return <DailyHabits />;
      case "search":
        return <DailySearch />;
      default:
        return children;
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden relative bg-background">
      {/* Sidebar Drawer */}
      <AppSidebar 
        isOpen={isOpen} 
        onToggle={() => setIsOpen(!isOpen)} 
        activeDailyTab={activeTab}
        onDailyTabChange={handleTabChange}
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
      <div className="flex-1 flex min-w-0 relative h-full">
        {/* Main Content */}
        <main className={cn(
            "flex-1 min-w-0 min-h-0 h-full relative overflow-hidden flex flex-col transition-all duration-500",
            isAssistantOpen ? "mr-[400px]" : "mr-0"
        )}>
          {renderContent()}
        </main>

        {/* Daily Assistant Slide-over */}
        <div className={cn(
          "fixed top-0 right-0 h-full bg-background border-l border-border/5 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] z-40 shadow-2xl",
          isAssistantOpen ? "w-[400px] translate-x-0" : "w-0 translate-x-full overflow-hidden border-none"
        )}>
          {isAssistantOpen && (
            <DailyAssistant onClose={() => setIsAssistantOpen(false)} />
          )}
        </div>
      </div>
    </div>
  );
}
