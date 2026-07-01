"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft as SidebarSimple } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DailyAssistant } from "@/components/daily/views/daily-assistant";

const DURATION_STANDARD = 0.25;
const EASE_OUT = [0.16, 1, 0.3, 1] as const; // Custom ease-out cubic bezier for smooth, premium motion

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isDailyPage = pathname.startsWith("/daily");

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

  // Close assistant slide-over if we navigate away from daily track
  useEffect(() => {
    if (!isDailyPage) {
      setIsAssistantOpen(false);
    }
  }, [pathname, isDailyPage]);

  return (
    <div className="flex w-full h-screen overflow-hidden relative bg-background">
      {/* Centralized Sidebar Drawer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: DURATION_STANDARD, ease: EASE_OUT }}
            className={cn(
              "shrink-0 h-full flex flex-col relative border-r border-border/5 bg-sidebar",
              isMobile && "absolute z-40 shadow-2xl",
            )}
            style={{ width: 260 }}
          >
            <AppSidebar
              isOpen={true}
              onToggle={() => setIsOpen(false)}
              activeDailyTab={isDailyPage ? (isAssistantOpen ? "assistant" : "calendar") : undefined}
              onDailyTabChange={(tab) => {
                if (tab === "assistant") {
                  setIsAssistantOpen((prev) => !prev);
                } else if (tab === "calendar") {
                  setIsAssistantOpen(false);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sidebar Toggle Button when Closed */}
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

      {/* Mobile Sidebar Overlay */}
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

      {/* Centralized Main Content Area */}
      <main
        className={cn(
          "flex-1 min-w-0 min-h-0 h-full relative overflow-hidden flex flex-col transition-[margin-right] duration-[300ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isAssistantOpen && !isMobile ? "mr-[400px]" : "mr-0",
        )}
      >
        {children}
      </main>

      {/* Daily Assistant Slide-over Panel (only on /daily) */}
      <AnimatePresence>
        {isDailyPage && isAssistantOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed top-0 right-0 h-full bg-sidebar border-l border-border/5 z-40 shadow-2xl"
            style={{ width: isMobile ? "100%" : 400 }}
          >
            <DailyAssistant onClose={() => setIsAssistantOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
