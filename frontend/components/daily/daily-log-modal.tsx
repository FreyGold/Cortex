"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/components/daily/full-calendar/animations";
import { DailyLogView } from "./daily-log-view";

interface DailyLogModalProps {
  date: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}

export function DailyLogModal({
  date,
  isOpen,
  onOpenChange,
  workspaceId,
}: DailyLogModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 12, rotateX: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12, rotateX: 5 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-2xl shadow-2xl shadow-black/10 border border-border/20 flex flex-col overflow-hidden w-full max-w-[calc(100%-2rem)] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-[85vh] max-h-[850px]"
          >
            <DailyLogView date={date} workspaceId={workspaceId} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
