"use client";

import { motion } from "framer-motion";
import { fadeIn, transition } from "@/components/daily/full-calendar/animations";
import { useCalendar } from "@/components/daily/full-calendar/contexts/calendar-context";
import { CalendarMonthView } from "@/components/daily/full-calendar/views/month-view/calendar-month-view";

export function CalendarBody() {
  const { view } = useCalendar();

  return (
    <div className="w-full h-full overflow-auto relative custom-scrollbar">
      <motion.div
        key={view}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={fadeIn}
        transition={transition}
        className="h-full"
      >
        {view === "month" && <CalendarMonthView />}
      </motion.div>
    </div>
  );
}
