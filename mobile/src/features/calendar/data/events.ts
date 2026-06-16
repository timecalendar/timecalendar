import { useMemo } from "react"

import {
  type PersonalEvent,
  usePersonalEvents,
} from "@/features/personal-events"

import { useSyncedEvents } from "./sync"
import { type CalendarEvent } from "./types"

export interface DateRange {
  from: Date
  to: Date
}

// Map a PersonalEvent (a real device row that already renders elsewhere) into a
// CalendarEvent. Personal events are timed, single-calendar, and carry no
// teachers/tags/cancellation — those sync-model fields stay empty.
function personalToCalendarEvent(event: PersonalEvent): CalendarEvent {
  return {
    id: event.uid,
    title: event.title,
    color: event.color,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: event.location,
    allDay: false,
    description: event.description,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: undefined,
  }
}

// An event intersects the range when it starts before the range ends and ends
// after the range starts (half-open, consistent with the overlap engine).
function intersectsRange(event: CalendarEvent, range: DateRange): boolean {
  return event.startsAt < range.to && event.endsAt > range.from
}

// THE single events-source seam (calendar.md). The screen must not know where
// events come from. The calendar-sync ship swapped the source here: it now reads
// the synced `calendar_events` rows (reactively, via useSyncedEvents) merged with
// the existing personal-events read, mapped to CalendarEvent and range-filtered —
// WITHOUT changing this hook's signature, the CalendarEvent shape, or any
// consumer. The dense-week fixture is no longer merged at runtime (dev/test-only —
// still exported from data/index for the primitive/screen tests + optional __DEV__
// seeding). Personal events (device-local, not synced) render alongside the synced
// timetable — the user's own events and their classes in one view (Flutter parity:
// both EventKinds render together).
export function useCalendarEvents(range: DateRange): CalendarEvent[] {
  const syncedEvents = useSyncedEvents(range)
  const personalEvents = usePersonalEvents()
  return useMemo(() => {
    const merged = [
      ...syncedEvents,
      ...personalEvents.map(personalToCalendarEvent),
    ]
    return merged.filter((event) => intersectsRange(event, range))
  }, [syncedEvents, personalEvents, range])
}
