"use client";

import { motion } from "framer-motion";
import { Search, Sparkles, Target, TrendingUp } from "lucide-react";
import {
  slideFromLeft,
  transition,
} from "@/components/daily/full-calendar/animations";
import { useCalendar } from "@/components/daily/full-calendar/contexts/calendar-context";
import { DateNavigator } from "@/components/daily/full-calendar/header/date-navigator";
import { TodayButton } from "@/components/daily/full-calendar/header/today-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarHeaderProps {
  onHabitsOpen?: () => void;
  onInsightsOpen?: () => void;
  onSearchOpen?: () => void;
  onAssistantOpen?: () => void;
}

export function CalendarHeader({
  onHabitsOpen,
  onInsightsOpen,
  onSearchOpen,
  onAssistantOpen,
}: CalendarHeaderProps) {
  const { view, events } = useCalendar();

  return (
    <div className="flex items-center justify-between border-b px-4 py-2.5 bg-card/50">
      <motion.div
        className="flex items-center gap-2"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </motion.div>
      <div className="flex items-center gap-1">
        {onHabitsOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHabitsOpen}
            className={cn(
              "h-8 px-2.5 rounded-lg text-[12px] font-semibold gap-1.5",
              "text-muted-foreground/70 hover:text-foreground hover:bg-accent/40",
            )}
          >
            <Target className="size-3.5" />
            Habits
          </Button>
        )}
        {onInsightsOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onInsightsOpen}
            className={cn(
              "h-8 px-2.5 rounded-lg text-[12px] font-semibold gap-1.5",
              "text-muted-foreground/70 hover:text-foreground hover:bg-accent/40",
            )}
          >
            <TrendingUp className="size-3.5" />
            Insights
          </Button>
        )}
        {onSearchOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchOpen}
            className={cn(
              "h-8 px-2.5 rounded-lg text-[12px] font-semibold gap-1.5",
              "text-muted-foreground/70 hover:text-foreground hover:bg-accent/40",
            )}
          >
            <Search className="size-3.5" />
            Search
          </Button>
        )}
        {onAssistantOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAssistantOpen}
            className={cn(
              "h-8 px-2.5 rounded-lg text-[12px] font-semibold gap-1.5",
              "text-muted-foreground/70 hover:text-foreground hover:bg-accent/40",
            )}
          >
            <Sparkles className="size-3.5" />
            Assistant
          </Button>
        )}
      </div>
    </div>
  );
}
