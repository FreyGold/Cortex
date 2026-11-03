"use client";

import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  History,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";
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

export function DailySearch() {
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

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/30 pointer-events-none z-10" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your history..."
            className="h-12 pl-12 pr-10 rounded-2xl bg-card border-border/10 text-[15px] focus-visible:ring-2 focus-visible:ring-primary/15"
          />
          <AnimatePresence>
            {isSearching && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12, ease: EASE_OUT }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Empty state suggestions */}
        <AnimatePresence mode="wait">
          {!query && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="space-y-3"
            >
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                Try searching for
              </p>
              <div className="flex flex-wrap gap-2">
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
                      onClick={() => setQuery(s)}
                      className="h-8 rounded-lg px-3 text-[13px] bg-card border-border/10 hover:bg-accent/50 transition-colors"
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
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-muted-foreground">
                  {results.length} results
                </span>
              </div>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-2"
              >
                {results.map((res) => (
                  <motion.div key={res.id} variants={staggerItem}>
                    <Card className="group border-border/10 bg-card hover:border-border/25 transition-colors cursor-pointer overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-start gap-4 p-5">
                          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                            <Calendar className="size-4 text-muted-foreground/30" />
                            <span className="text-[10px] font-semibold text-muted-foreground/30">
                              {format(parseISO(res.date), "MMM d")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-[15px] font-semibold leading-none">
                                {res.highlight}
                              </h4>
                              <Badge className="text-[10px] font-bold bg-primary/8 text-primary shrink-0 px-2 py-0.5 rounded-md">
                                {Math.round(res.similarity * 100)}%
                              </Badge>
                            </div>
                            <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                              {res.content_text ||
                                "No detailed notes for this day."}
                            </p>
                            <div className="flex items-center gap-4 pt-1">
                              <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase tracking-wide">
                                {format(parseISO(res.date), "yyyy")}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <ArrowRight className="size-4 text-primary" />
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
  );
}
