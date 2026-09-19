import { useEffect, useRef } from "react"

import { useUserCalendars } from "@/features/calendar-sources/data"
import { useHiddenEvents } from "@/features/hidden-events/data"
import { usePersonalEventRowsInRange } from "@/features/personal-events"
import { recordError } from "@/firebase"

import { utcDayKey } from "./day-key"
import {
  type CalendarEventRejectionCounts,
  decodePersonalEventRows,
  decodeSyncedEventRows,
} from "./event-decoder"
import { useSyncedEventRowsInRange } from "./sync/hooks"
import { type CalendarEvent } from "./types"

export interface DateRange {
  from: Date
  to: Date
  civilFromDay?: string
  civilToDay?: string
}

export interface CalendarEventsSnapshot {
  events: readonly CalendarEvent[]
  ready: boolean
  error: Error | undefined
  revision: string
  rejectedCounts: CalendarEventRejectionCounts
  counts: {
    queriedSyncedTimed: number
    queriedSyncedDateOnly: number
    queriedPersonal: number
    accepted: number
    filtered: number
  }
}

function addCounts(
  left: CalendarEventRejectionCounts,
  right: CalendarEventRejectionCounts,
): CalendarEventRejectionCounts {
  return {
    "invalid-identity": left["invalid-identity"] + right["invalid-identity"],
    "invalid-start": left["invalid-start"] + right["invalid-start"],
    "invalid-end": left["invalid-end"] + right["invalid-end"],
    "non-positive-range":
      left["non-positive-range"] + right["non-positive-range"],
    "invalid-date-range":
      left["invalid-date-range"] + right["invalid-date-range"],
  }
}

function eventIntersectsRange(
  event: CalendarEvent,
  range: DateRange,
  civil: { fromDay: string; toDay: string },
): boolean {
  return event.kind === "date-only"
    ? event.startDay < civil.toDay && event.endDay > civil.fromDay
    : event.startsAt < range.to && event.endsAt > range.from
}

export function intersectsRange(
  event: CalendarEvent,
  range: DateRange,
): boolean {
  return eventIntersectsRange(event, range, {
    fromDay: range.civilFromDay ?? utcDayKey(range.from),
    toDay: range.civilToDay ?? utcDayKey(range.to),
  })
}

function useRejectedRowDiagnostics(
  ready: boolean,
  revision: string,
  counts: CalendarEventRejectionCounts,
): void {
  const reported = useRef(new Set<string>())
  useEffect(() => {
    if (!ready) return
    for (const [reason, count] of Object.entries(counts)) {
      if (count === 0) continue
      const key = `${revision}:${reason}`
      if (reported.current.has(key)) continue
      reported.current.add(key)
      recordError(
        new Error(`calendar-row-rejected:${reason}:${count}`),
        "calendar-local-read",
      )
    }
  }, [counts, ready, revision])
}

/** Bounded, validated, shared local Calendar read. */
export function useCalendarEventsSnapshot(
  range: DateRange,
): CalendarEventsSnapshot {
  const civil = {
    fromDay: range.civilFromDay ?? utcDayKey(range.from),
    toDay: range.civilToDay ?? utcDayKey(range.to),
  }
  const synced = useSyncedEventRowsInRange({ instant: range, civil })
  const personal = usePersonalEventRowsInRange(range)
  const { uidHiddenEvents, namedHiddenEvents } = useHiddenEvents()
  const calendars = useUserCalendars()

  const syncedDecoded = decodeSyncedEventRows([
    ...synced.timedRows,
    ...synced.dateOnlyRows,
  ])
  const personalDecoded = decodePersonalEventRows(personal.rows)
  const decoded = {
    events: [...syncedDecoded.accepted, ...personalDecoded.accepted],
    rejectedCounts: addCounts(
      syncedDecoded.rejectedCounts,
      personalDecoded.rejectedCounts,
    ),
  }

  const hiddenUids = new Set(uidHiddenEvents)
  const hiddenNames = new Set(namedHiddenEvents)
  const visibleCalendarIds = new Set<string>()
  for (const calendar of calendars) {
    if (calendar.visible) visibleCalendarIds.add(calendar.id)
  }
  const events = decoded.events.filter(
    (event) =>
      !event.canceled &&
      !hiddenUids.has(event.identity.uid) &&
      !hiddenNames.has(event.title) &&
      (event.identity.source === "personal" ||
        (event.userCalendarId !== undefined &&
          visibleCalendarIds.has(event.userCalendarId))) &&
      eventIntersectsRange(event, range, civil),
  )
  const ready = synced.ready && personal.ready
  const revision = `${synced.revision}:${personal.revision}`
  useRejectedRowDiagnostics(ready, revision, decoded.rejectedCounts)

  return {
    events,
    ready,
    error: synced.error ?? personal.error,
    revision,
    rejectedCounts: decoded.rejectedCounts,
    counts: {
      queriedSyncedTimed: synced.timedRows.length,
      queriedSyncedDateOnly: synced.dateOnlyRows.length,
      queriedPersonal: personal.rows.length,
      accepted: decoded.events.length,
      filtered: decoded.events.length - events.length,
    },
  }
}

export function useCalendarEvents(range: DateRange): CalendarEvent[] {
  return [...useCalendarEventsSnapshot(range).events]
}
