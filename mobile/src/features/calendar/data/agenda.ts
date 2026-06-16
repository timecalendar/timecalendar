// The agenda's pure day-grouping logic — the agenda analog of `layoutOverlaps`,
// 90%-gated, mirroring the Flutter `events_for_planning_view_helper` / `EventsByDay`.
// Pure: no React, no calendar-kit, no @/db, no t(), no date-fns (grouping is plain
// calendar-day arithmetic; formatting is format.ts's job).

import { type CalendarEvent } from "./types"

export interface AgendaDay {
  /** Local midnight of the bucket's calendar day. */
  day: Date
  events: CalendarEvent[]
}

// Local Y-M-D key (NOT UTC) so a 23:30-local event buckets on its own local day,
// mirroring Flutter `isSameDate`.
function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function localMidnight(date: Date): Date {
  const midnight = new Date(date)
  midnight.setHours(0, 0, 0, 0)
  return midnight
}

// Group flat events into per-local-calendar-day buckets, each sorted by start time
// (stable tie-break, mirroring overlap-layout for determinism), buckets ascending by
// day. Empty input → []. We group by each event's own `startsAt` local day — NOT the
// Flutter `endsAt`-carry quirk (which keys the running day on the previous event's
// `endsAt` and can mis-bucket an event that starts a new day after a long prior one).
export function groupEventsByDay(events: CalendarEvent[]): AgendaDay[] {
  const sorted = [...events].sort((a, b) => {
    const byStart = a.startsAt.getTime() - b.startsAt.getTime()
    if (byStart !== 0) return byStart
    return a.id.localeCompare(b.id)
  })

  const buckets = new Map<string, AgendaDay>()
  for (const event of sorted) {
    const key = localDayKey(event.startsAt)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.events.push(event)
    } else {
      buckets.set(key, { day: localMidnight(event.startsAt), events: [event] })
    }
  }

  return [...buckets.values()].sort((a, b) => a.day.getTime() - b.day.getTime())
}
