import { useMemo } from "react"

import { calendarEvents, db, useLiveQuery } from "@/db"
import type { CalendarEvent } from "@/features/calendar/data/types"

import { rowToCalendarEvent } from "./types"

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import): re-renders the calendar views when a sync's
// replaceAll mutates the calendar_events table. It reads the whole (small) table
// live and maps row→domain — range filtering happens ONCE in useCalendarEvents (it
// merges these with personal events and filters the combined set, so filtering here
// too would be redundant). The repository's findInRange is the non-reactive read
// for tests / imperative callers.
export function useSyncedEvents(): CalendarEvent[] {
  const { data } = useLiveQuery(db.select().from(calendarEvents))
  return useMemo(() => data.map(rowToCalendarEvent), [data])
}
