import { type CalendarEvent } from "@/features/calendar/data"

function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function utcDayKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function representedDayKey(event: CalendarEvent): string {
  return event.allDay ? utcDayKey(event.startsAt) : localDayKey(event.startsAt)
}

function localDateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year!, month! - 1, day!)
}

export function eventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const floatingKey = localDayKey(dayStart)
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
): NextActiveDay | undefined {
  const todayKey = localDayKey(now)
  const firstKey = events
    .map(representedDayKey)
    .filter((key) => key > todayKey)
    .sort()[0]
  if (firstKey === undefined) return undefined
  const day = localDateFromKey(firstKey)
  const dayEvents = eventsForDay(events, day)
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
  const hash = Number(localDayKey(now).replaceAll("-", ""))
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
): HourRange {
  const timed = events.filter((event) => !event.allDay)
  if (timed.length === 0) return { startHour: 8, endHour: 18 }
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  let startMinute = 24 * 60
  let endMinute = 0
  for (const event of timed) {
    const visibleStart = event.startsAt < dayStart ? dayStart : event.startsAt
    const visibleEnd = event.endsAt > dayEnd ? dayEnd : event.endsAt
    const startsAtMinute =
      visibleStart.getTime() === dayStart.getTime()
        ? 0
        : visibleStart.getHours() * 60 + visibleStart.getMinutes()
    const endsAtMinute =
      visibleEnd.getTime() === dayEnd.getTime()
        ? 24 * 60
        : visibleEnd.getHours() * 60 + visibleEnd.getMinutes()
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
