// The agenda's pure day-grouping logic — the agenda analog of `layoutOverlaps`,
// 90%-gated, mirroring the Flutter `events_for_planning_view_helper` / `EventsByDay`.
// Pure: no React, no calendar-kit, no @/db, no t() (grouping is calendar-day
// arithmetic over the day-key seam; formatting is format.ts's job).

import { dayKey, startOfDayInZone } from "./day-key"
import { type CalendarEvent } from "./types"

export interface AgendaDay {
  /** The instant of the display zone's midnight for the bucket's calendar day. */
  day: Date
  events: CalendarEvent[]
}

// Group flat events into per-display-zone-calendar-day buckets, each sorted by
// start time (stable tie-break, mirroring overlap-layout for determinism), buckets
// ascending by day. Empty input → []. We group by each event's own `startsAt` zone
// day — NOT the Flutter `endsAt`-carry quirk (which keys the running day on the
// previous event's `endsAt` and can mis-bucket an event that starts a new day
// after a long prior one).
export function groupEventsByDay(
  events: CalendarEvent[],
  zone: string,
): AgendaDay[] {
  const sorted = [...events].sort((a, b) => {
    const byStart = a.startsAt.getTime() - b.startsAt.getTime()
    if (byStart !== 0) return byStart
    return a.id.localeCompare(b.id)
  })

  const buckets = new Map<string, AgendaDay>()
  for (const event of sorted) {
    const key = dayKey(event.startsAt, zone)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.events.push(event)
    } else {
      buckets.set(key, {
        day: startOfDayInZone(event.startsAt, zone),
        events: [event],
      })
    }
  }

  return [...buckets.values()].sort((a, b) => a.day.getTime() - b.day.getTime())
}
