"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";
import { EASE_OUT } from "@/components/daily/full-calendar/animations";
import { Button } from "@/components/ui/button";
import { DailyAssistant } from "./daily-assistant";

interface AssistantModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistantModal({ isOpen, onOpenChange }: AssistantModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
        className="fixed inset-0 z-50 bg-background/30 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-2xl shadow-modal overflow-hidden flex flex-col w-full max-w-[calc(100%-2rem)] sm:max-w-3xl h-[85vh] max-h-[850px]"
      >
        <div className="flex-1 overflow-hidden">
          <DailyAssistant onClose={() => onOpenChange(false)} />
        </div>
      </motion.div>
    </>
  );
}
