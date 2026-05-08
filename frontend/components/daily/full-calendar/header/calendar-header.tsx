"use client";

import { motion } from "framer-motion";
import {
  slideFromLeft,
  transition,
} from "@/components/daily/full-calendar/animations";
import { useCalendar } from "@/components/daily/full-calendar/contexts/calendar-context";
import { DateNavigator } from "@/components/daily/full-calendar/header/date-navigator";
import { TodayButton } from "@/components/daily/full-calendar/header/today-button";

export function CalendarHeader() {
  const { view, events } = useCalendar();

  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between bg-card/50">
      <motion.div
        className="flex items-center gap-3"
        variants={slideFromLeft}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </motion.div>
    </div>
  );
}
