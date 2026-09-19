import { useMemo } from "react"

import { and, calendarEvents, db, eq, gt, lt, useLiveQuery } from "@/db"
import { decodeSyncedEventRows } from "@/features/calendar/data/event-decoder"
import type { CalendarEvent } from "@/features/calendar/data/types"

// Reactive read over the seam's useLiveQuery (re-exported from @/db, never a
// direct drizzle-orm import): re-renders the calendar views when a sync's
// replaceAll mutates the calendar_events table. It reads the whole (small) table
// live and maps row→domain — range filtering happens ONCE in useCalendarEvents (it
// merges these with personal events and filters the combined set, so filtering here
// too would be redundant).
export function useSyncedEvents(): CalendarEvent[] {
  const { data } = useLiveQuery(db.select().from(calendarEvents))
  return useMemo(() => [...decodeSyncedEventRows(data).accepted], [data])
}

export interface SyncedEventRowRange {
  instant: { from: Date; to: Date }
  civil: { fromDay: string; toDay: string }
}

export function useSyncedEventRowsInRange(range: SyncedEventRowRange) {
  const fromIso = range.instant.from.toISOString()
  const toIso = range.instant.to.toISOString()
  const fromDayIso = `${range.civil.fromDay}T00:00:00.000Z`
  const toDayIso = `${range.civil.toDay}T00:00:00.000Z`
  const timed = useLiveQuery(
    db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.allDay, false),
          lt(calendarEvents.startsAt, toIso),
          gt(calendarEvents.endsAt, fromIso),
        ),
      ),
    [`timed:${fromIso}:${toIso}`],
  )
  const dateOnly = useLiveQuery(
    db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.allDay, true),
          lt(calendarEvents.startsAt, toDayIso),
          gt(calendarEvents.endsAt, fromDayIso),
        ),
      ),
    [`date-only:${fromDayIso}:${toDayIso}`],
  )

  return {
    timedRows: timed.data,
    dateOnlyRows: dateOnly.data,
    error: timed.error ?? dateOnly.error,
    ready: timed.updatedAt !== undefined && dateOnly.updatedAt !== undefined,
    revision: `${timed.updatedAt?.getTime() ?? "pending"}:${dateOnly.updatedAt?.getTime() ?? "pending"}`,
  }
}
