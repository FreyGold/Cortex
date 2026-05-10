import React from "react";
import { CalendarBody } from "@/components/daily/full-calendar/calendar-body";
import { CalendarProvider } from "@/components/daily/full-calendar/contexts/calendar-context";
import { DndProvider } from "@/components/daily/full-calendar/contexts/dnd-context";
import { CalendarHeader } from "@/components/daily/full-calendar/header/calendar-header";
import { getEvents, getUsers } from "@/components/daily/full-calendar/requests";

async function getCalendarData() {
  return {
    events: await getEvents(),
    users: await getUsers(),
  };
}

interface CalendarProps {
  onHabitsOpen?: () => void;
}

export async function Calendar({ onHabitsOpen }: CalendarProps) {
  const { events, users } = await getCalendarData();

  return (
    <CalendarProvider events={events} users={users} view="month">
      <DndProvider>
        <div className="w-full bg-card rounded-2xl overflow-hidden">
          <CalendarHeader onHabitsOpen={onHabitsOpen} />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
