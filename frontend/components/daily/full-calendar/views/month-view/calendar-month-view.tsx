"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  staggerContainer,
  transition,
} from "@/components/daily/full-calendar/animations";
import { useCalendar } from "@/components/daily/full-calendar/contexts/calendar-context";

import { getCalendarCells } from "@/components/daily/full-calendar/helpers";

import { DayCell } from "@/components/daily/full-calendar/views/month-view/day-cell";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView() {
  const { selectedDate, events } = useCalendar();

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="h-full flex flex-col"
    >
      <div className="grid grid-cols-7 border-b border-border/5 bg-muted/30">
        {WEEK_DAYS.map((day, index) => (
          <motion.div
            key={day}
            className="flex items-center justify-center py-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, ...transition }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              {day}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 overflow-hidden">
        {cells.map((cell) => (
          <DayCell
            key={cell.date.toISOString()}
            cell={cell}
            events={events}
            eventPositions={{}}
          />
        ))}
      </div>
    </motion.div>
  );
}
