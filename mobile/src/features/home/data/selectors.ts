import {
  addDaysInZone,
  type CalendarEvent,
  dayKey,
  dayKeyToDate,
  minuteOfDayInZone,
  startOfDayInZone,
  utcDayKey,
} from "@/features/calendar/data"

// Day-level selection runs on the DISPLAY zone's calendar (timezone design D4):
// day bounds are zone-midnight instants, timed events key on their zone day,
// and all-day events keep their floating UTC key. Only `greetingSelection`
// stays device-local (D7 — it is about where the user physically is).

function representedDayKey(event: CalendarEvent, zone: string): string {
  return event.allDay ? utcDayKey(event.startsAt) : dayKey(event.startsAt, zone)
}

export function eventsForDay(
  events: CalendarEvent[],
  day: Date,
  zone: string,
): CalendarEvent[] {
  const dayStart = startOfDayInZone(day, zone)
  const dayEnd = addDaysInZone(dayStart, 1, zone)
  const floatingKey = dayKey(dayStart, zone)
  return events
    .filter((event) =>
      event.allDay
        ? utcDayKey(event.startsAt) <= floatingKey &&
          utcDayKey(event.endsAt) > floatingKey
        : event.startsAt < dayEnd && event.endsAt > dayStart,
    )
    .sort((a, b) => {
      const byStart = a.startsAt.getTime() - b.startsAt.getTime()
      return byStart === 0 ? a.id.localeCompare(b.id) : byStart
    })
}

export function remainingEvents(
  events: CalendarEvent[],
  now: Date,
): CalendarEvent[] {
  return events.filter((event) => event.allDay || event.endsAt > now)
}

export function splitDayEvents(events: CalendarEvent[]): {
  allDay: CalendarEvent[]
  timed: CalendarEvent[]
} {
  return {
    allDay: events.filter((event) => event.allDay),
    timed: events.filter((event) => !event.allDay),
  }
}

export interface NextActiveDay {
  day: Date
  events: CalendarEvent[]
  firstTimedStart: Date | undefined
}

export function nextActiveDay(
  events: CalendarEvent[],
  now: Date,
  zone: string,
): NextActiveDay | undefined {
  const todayKey = dayKey(now, zone)
  const firstKey = events
    .map((event) => representedDayKey(event, zone))
    .filter((key) => key > todayKey)
    .sort()[0]
  if (firstKey === undefined) return undefined
  const day = dayKeyToDate(firstKey, zone)
  const dayEvents = eventsForDay(events, day, zone)
  return {
    day,
    events: dayEvents,
    firstTimedStart: dayEvents.find((event) => !event.allDay)?.startsAt,
  }
}

export type GreetingPeriod =
  | "early"
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "night"

export interface GreetingSelection {
  period: GreetingPeriod
  weekend: boolean
  variant: 0 | 1
}

// Deliberately DEVICE-LOCAL (D7): good-morning/evening follows where the user
// physically is, not the display-timezone preference.
export function greetingSelection(now: Date): GreetingSelection {
  const hour = now.getHours()
  const period: GreetingPeriod =
    hour >= 5 && hour < 9
      ? "early"
      : hour >= 9 && hour < 12
        ? "morning"
        : hour >= 12 && hour < 14
          ? "midday"
          : hour >= 14 && hour < 18
            ? "afternoon"
            : hour >= 18 && hour < 22
              ? "evening"
              : "night"
  // The numeric YYYYMMDD of the device-local day (the former localDayKey hash).
  const hash =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  return {
    period,
    weekend: now.getDay() === 0 || now.getDay() === 6,
    variant: (hash % 2) as 0 | 1,
  }
}

export type DayCaption =
  | { kind: "empty" | "finished" | "allDayOnly" }
  | { kind: "ongoing"; end: Date }
  | { kind: "singleFuture"; start: Date; end: Date }
  | { kind: "futureSpan"; start: Date; end: Date }

export function dayCaption(events: CalendarEvent[], now: Date): DayCaption {
  if (events.length === 0) return { kind: "empty" }
  const timed = events.filter((event) => !event.allDay)
  if (timed.length === 0) return { kind: "allDayOnly" }
  const ongoing = timed.find(
    (event) => event.startsAt <= now && event.endsAt > now,
  )
  if (ongoing !== undefined) return { kind: "ongoing", end: ongoing.endsAt }
  const future = timed.filter((event) => event.startsAt > now)
  if (future.length === 0) return { kind: "finished" }
  const first = future[0]!
  if (future.length === 1) {
    return { kind: "singleFuture", start: first.startsAt, end: first.endsAt }
  }
  const lastEnd = future.reduce(
    (latest, event) => (event.endsAt > latest ? event.endsAt : latest),
    first.endsAt,
  )
  return { kind: "futureSpan", start: first.startsAt, end: lastEnd }
}

export interface HourRange {
  startHour: number
  endHour: number
}

export function dynamicHourRange(
  events: CalendarEvent[],
  day: Date,
  zone: string,
): HourRange {
  const timed = events.filter((event) => !event.allDay)
  if (timed.length === 0) return { startHour: 8, endHour: 18 }
  const dayStart = startOfDayInZone(day, zone)
  const dayEnd = addDaysInZone(dayStart, 1, zone)
  let startMinute = 24 * 60
  let endMinute = 0
  for (const event of timed) {
    const visibleStart = event.startsAt < dayStart ? dayStart : event.startsAt
    const visibleEnd = event.endsAt > dayEnd ? dayEnd : event.endsAt
    const startsAtMinute =
      visibleStart.getTime() === dayStart.getTime()
        ? 0
        : minuteOfDayInZone(visibleStart, zone)
    const endsAtMinute =
      visibleEnd.getTime() === dayEnd.getTime()
        ? 24 * 60
        : minuteOfDayInZone(visibleEnd, zone)
    startMinute = Math.min(startMinute, startsAtMinute)
    endMinute = Math.max(endMinute, endsAtMinute)
  }
  return {
    startHour: Math.floor(startMinute / 60),
    endHour: Math.max(
      Math.floor(startMinute / 60) + 1,
      Math.ceil(endMinute / 60),
    ),
  }
}
