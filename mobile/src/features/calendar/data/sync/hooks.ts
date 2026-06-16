import { useMemo } from "react"

import { calendarEvents, db, useLiveQuery } from "@/db"
import type { DateRange } from "@/features/calendar/data/events"
import type { CalendarEvent } from "@/features/calendar/data/types"

import { rowToCalendarEvent } from "./types"

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import): re-renders the calendar views when a sync's
// replaceAll mutates the calendar_events table. It reads the whole (small) table
// live and maps + range-filters in a useMemo — range filtering in JS keeps the
// reactive subscription simple and matches the views' bounded windows. The
// repository's findInRange is the non-reactive read for tests / imperative
// callers.
function intersectsRange(event: CalendarEvent, range: DateRange): boolean {
  return event.startsAt < range.to && event.endsAt > range.from
}

export function useSyncedEvents(range: DateRange): CalendarEvent[] {
  const { data } = useLiveQuery(db.select().from(calendarEvents))
  return useMemo(
    () =>
      data
        .map(rowToCalendarEvent)
        .filter((event) => intersectsRange(event, range)),
    [data, range],
  )
}
