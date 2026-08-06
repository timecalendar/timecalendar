import { type CalendarEvent, utcDayKey } from "@/features/calendar/data"

import { type EventItem } from "./vendor"

export type CalendarKitEventItem = EventItem & { source: CalendarEvent }

export function toCalendarKitEvent(event: CalendarEvent): CalendarKitEventItem {
  const base = {
    id: event.id,
    title: event.title,
    color: event.color,
    location: event.location,
    allDay: event.allDay,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    source: event,
  }
  if (event.allDay) {
    const lastCoveredMs = Math.max(
      event.startsAt.getTime(),
      event.endsAt.getTime() - 1,
    )
    return {
      ...base,
      start: { date: utcDayKey(event.startsAt) },
      end: { date: utcDayKey(new Date(lastCoveredMs)) },
    }
  }
  return {
    ...base,
    start: { dateTime: event.startsAt.toISOString() },
    end: { dateTime: event.endsAt.toISOString() },
  }
}
