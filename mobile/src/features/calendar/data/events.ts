import { useMemo } from "react"

import {
  type PersonalEvent,
  usePersonalEvents,
} from "@/features/personal-events"

import { denseWeekFixture } from "./fixtures"
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

// THE single events-source seam (D3). The screen must not know where events come
// from. This ship feeds it from a committed dense-week fixture merged with the
// existing personal-events read, mapped to CalendarEvent and filtered to the
// range. The later calendar-SYNC ship swaps the source here (to the synced
// `calendar_events` rows, or a merge of synced + personal) WITHOUT changing this
// hook's signature, the CalendarEvent shape, or any consumer — the swap is this
// one file. The fixture is removed / dev-gated then.
export function useCalendarEvents(range: DateRange): CalendarEvent[] {
  const personalEvents = usePersonalEvents()
  return useMemo(() => {
    const merged = [
      ...denseWeekFixture(),
      ...personalEvents.map(personalToCalendarEvent),
    ]
    return merged.filter((event) => intersectsRange(event, range))
  }, [personalEvents, range])
}
