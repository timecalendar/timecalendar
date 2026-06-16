// The home view's pure "what day to show + the digest" selectors (D4) — 90%-gated.
// Pure: no React, no @/db, no t(), no date-fns. They consume the merged events from
// the unchanged calendar events-source seam and decide the displayed day, the day's
// events, and the timeline's dynamic hour window. They are the ONLY genuinely new
// logic in this ship; everything else (layout, pixel math, formatting, the read,
// sync, routing) is landed seams reused as-is.

import { type CalendarEvent } from "@/features/calendar/data"

function localMidnight(date: Date): Date {
  const midnight = new Date(date)
  midnight.setHours(0, 0, 0, 0)
  return midnight
}

// Local Y-M-D key (NOT UTC) so a 23:30-local event buckets on its own local day,
// mirroring the agenda's localDayKey / Flutter `isSameDate`.
function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// The day the home page shows (Flutter `dayDisplayedOnHomePageProvider` parity):
// TODAY (local midnight) if any event ENDS after `now` on today's local calendar
// day; else local midnight of the FIRST event starting after `now`; else today.
//
// We key "today has something left" on `endsAt > now` (an in-progress class still
// counts) — a deliberate refinement over Flutter's `startsAt.isAfter(today)`, which
// keyed on the day boundary. Recorded here so it isn't "fixed" back to the Flutter
// form.
export function displayedDay(events: CalendarEvent[], now: Date): Date {
  const today = localMidnight(now)
  const todayKey = localDayKey(now)

  const hasRemainingToday = events.some(
    (event) => localDayKey(event.startsAt) === todayKey && event.endsAt > now,
  )
  if (hasRemainingToday) return today

  let nextFuture: CalendarEvent | undefined
  for (const event of events) {
    if (event.startsAt > now) {
      if (nextFuture === undefined || event.startsAt < nextFuture.startsAt) {
        nextFuture = event
      }
    }
  }
  if (nextFuture !== undefined) return localMidnight(nextFuture.startsAt)

  return today
}

// The events whose `startsAt` falls on `day`'s local calendar day, sorted by start
// with a stable `id` tie-break (mirroring groupEventsByDay / layoutOverlaps for
// deterministic ordering).
export function eventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  const dayKey = localDayKey(day)
  return events
    .filter((event) => localDayKey(event.startsAt) === dayKey)
    .sort((a, b) => {
      const byStart = a.startsAt.getTime() - b.startsAt.getTime()
      if (byStart !== 0) return byStart
      return a.id.localeCompare(b.id)
    })
}

export interface HourRange {
  startHour: number
  endHour: number
}

// The today timeline's dynamic hour window (Flutter `today_events` parity):
// startHour = min(event start hour), endHour = max(event end hour) + 1; empty →
// the 8–18 fallback. Clamped to [0, 24].
export function dynamicHourRange(events: CalendarEvent[]): HourRange {
  if (events.length === 0) return { startHour: 8, endHour: 18 }

  let startHour = 24
  let endHour = 0
  for (const event of events) {
    startHour = Math.min(startHour, event.startsAt.getHours())
    endHour = Math.max(endHour, event.endsAt.getHours() + 1)
  }

  return {
    startHour: Math.max(0, Math.min(24, startHour)),
    endHour: Math.max(0, Math.min(24, endHour)),
  }
}
