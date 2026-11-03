"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft as SidebarSimple } from "lucide-react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
  DURATION_STANDARD,
  EASE_OUT,
} from "@/components/daily/full-calendar/animations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DailyAssistant } from "./views/daily-assistant";

export function DailyLayoutClient({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex w-full h-screen overflow-hidden relative bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: DURATION_STANDARD, ease: EASE_OUT }}
            className={cn(
              "shrink-0 h-full flex flex-col relative",
              isMobile && "absolute z-40 shadow-2xl",
            )}
            style={{ width: 260 }}
          >
            <AppSidebar
              isOpen={true}
              onToggle={() => setIsOpen(false)}
              activeDailyTab="calendar"
              onDailyTabChange={(tab) => {
                if (tab === "assistant") setIsAssistantOpen((v) => !v);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button when sidebar closed (floating) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: DURATION_STANDARD, ease: EASE_OUT }}
            className="absolute top-4 left-4 z-50"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(true)}
              className="h-9 w-9 text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-md shadow-xl border border-border/10 rounded-xl transition-colors hover:bg-background"
            >
              <SidebarSimple className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE_OUT }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-w-0 min-h-0 h-full relative overflow-hidden flex flex-col",
          isAssistantOpen ? "mr-[400px]" : "mr-0",
          "transition-[margin] duration-[300ms]",
        )}
      >
        {children}
      </main>

      {/* Daily Assistant Slide-over */}
      <AnimatePresence>
        {isAssistantOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed top-0 right-0 h-full bg-sidebar border-l border-border/5 z-40 shadow-2xl"
            style={{ width: 400 }}
          >
            <DailyAssistant onClose={() => setIsAssistantOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
