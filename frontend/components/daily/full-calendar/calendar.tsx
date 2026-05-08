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

export async function Calendar() {
  const { events, users } = await getCalendarData();

  return (
    <CalendarProvider events={events} users={users} view="month">
      <DndProvider>
        <div className="w-full border rounded-xl">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
