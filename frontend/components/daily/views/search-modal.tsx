"use client";

import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  EASE_OUT,
  staggerContainer,
  staggerItem,
} from "@/components/daily/full-calendar/animations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSearchDailyLogs } from "@/hooks/use-daily";
import { useDebounce } from "@/hooks/use-debounce";

const SUGGESTIONS = [
  "last week progress",
  "exam preparation",
  "project milestones",
  "meditation streak",
];

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ isOpen, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const searchMutation = useSearchDailyLogs();

  useEffect(() => {
    if (debouncedQuery.length > 2) {
      searchMutation.mutate(debouncedQuery);
    }
  }, [debouncedQuery]);

  const results = searchMutation.data?.results || [];
  const isSearching = searchMutation.isPending;

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
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-background rounded-2xl shadow-modal overflow-hidden flex flex-col"
        style={{ width: "44vw", height: "80vh" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center">
              <Search className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold leading-none">Search</h2>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                Find memories in your history
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-5 py-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/30 pointer-events-none z-10" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your history..."
                className="h-9 pl-10 pr-4 rounded-xl bg-muted/40 border-border/10 text-[13px] focus-visible:ring-2 focus-visible:ring-primary/20"
                autoFocus
              />
              <AnimatePresence>
                {isSearching && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.12, ease: EASE_OUT }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  >
                    <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Empty state suggestions */}
            <AnimatePresence mode="wait">
              {!query && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="space-y-2.5"
                >
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Try searching for
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.15,
                          delay: i * 0.04,
                          ease: EASE_OUT,
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuery(s)}
                          className="h-7 rounded-lg px-3 text-[11px] bg-muted/40 border-border/10 hover:bg-accent/50 transition-colors"
                        >
                          {s}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="space-y-2"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {results.length} results
                  </span>
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-1.5"
                  >
                    {results.map((res) => (
                      <motion.div key={res.id} variants={staggerItem}>
                        <Card className="group border-border/10 bg-muted/30 hover:border-border/25 transition-colors cursor-pointer overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex items-start gap-3 p-3.5">
                              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                                <Calendar className="size-3.5 text-muted-foreground/30" />
                                <span className="text-[9px] font-semibold text-muted-foreground/30">
                                  {format(parseISO(res.date), "MMM d")}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-[13px] font-semibold leading-none">
                                    {res.highlight}
                                  </h4>
                                  <Badge className="text-[9px] font-bold bg-primary/8 text-primary shrink-0 px-1.5 py-0.5 rounded-md">
                                    {Math.round(res.similarity * 100)}%
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                  {res.content_text ||
                                    "No detailed notes for this day."}
                                </p>
                              </div>
                              <div className="shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <ArrowRight className="size-3.5 text-primary" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
