import { type CalendarEvent } from "@/features/calendar/data"

import { displayedDay, dynamicHourRange, eventsForDay } from "./selectors"

// Local-time dates so day-bucketing + hour math are TZ-independent.
function event(
  id: string,
  startsAt: Date,
  endsAt: Date,
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
  return {
    id,
    title: id,
    color: "#1E88E5",
    startsAt,
    endsAt,
    location: undefined,
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: undefined,
    ...overrides,
  }
}

const now = new Date(2026, 5, 16, 12, 0, 0, 0) // Tue 2026-06-16 12:00 local
const todayMidnight = new Date(2026, 5, 16, 0, 0, 0, 0)

describe("displayedDay", () => {
  it("returns today when an event ends after now today (in-progress counts)", () => {
    const inProgress = event(
      "a",
      new Date(2026, 5, 16, 11, 30),
      new Date(2026, 5, 16, 13, 0),
    )
    expect(displayedDay([inProgress], now).getTime()).toBe(
      todayMidnight.getTime(),
    )
  })

  it("returns today when a later event today starts after now", () => {
    const later = event(
      "a",
      new Date(2026, 5, 16, 15, 0),
      new Date(2026, 5, 16, 16, 0),
    )
    expect(displayedDay([later], now).getTime()).toBe(todayMidnight.getTime())
  })

  it("returns the next future day when today's events have all ended", () => {
    const pastToday = event(
      "a",
      new Date(2026, 5, 16, 8, 0),
      new Date(2026, 5, 16, 9, 30),
    )
    const future = event(
      "b",
      new Date(2026, 5, 18, 10, 0),
      new Date(2026, 5, 18, 11, 0),
    )
    expect(displayedDay([pastToday, future], now).getTime()).toBe(
      new Date(2026, 5, 18, 0, 0, 0, 0).getTime(),
    )
  })

  it("picks the EARLIEST future event's day when several future events exist", () => {
    const farFuture = event(
      "a",
      new Date(2026, 5, 20, 10, 0),
      new Date(2026, 5, 20, 11, 0),
    )
    const nearFuture = event(
      "b",
      new Date(2026, 5, 17, 9, 0),
      new Date(2026, 5, 17, 10, 0),
    )
    expect(displayedDay([farFuture, nearFuture], now).getTime()).toBe(
      new Date(2026, 5, 17, 0, 0, 0, 0).getTime(),
    )
  })

  it("returns today when there are no events", () => {
    expect(displayedDay([], now).getTime()).toBe(todayMidnight.getTime())
  })

  it("returns today when all events are in the past", () => {
    const past = event(
      "a",
      new Date(2026, 5, 10, 8, 0),
      new Date(2026, 5, 10, 9, 0),
    )
    expect(displayedDay([past], now).getTime()).toBe(todayMidnight.getTime())
  })
})

describe("eventsForDay", () => {
  it("returns only the events on the given local day, sorted by start", () => {
    const a = event(
      "a",
      new Date(2026, 5, 16, 14, 0),
      new Date(2026, 5, 16, 15, 0),
    )
    const b = event(
      "b",
      new Date(2026, 5, 16, 9, 0),
      new Date(2026, 5, 16, 10, 0),
    )
    const otherDay = event(
      "c",
      new Date(2026, 5, 17, 9, 0),
      new Date(2026, 5, 17, 10, 0),
    )
    const result = eventsForDay([a, b, otherDay], todayMidnight)
    expect(result.map((e) => e.id)).toEqual(["b", "a"])
  })

  it("buckets a 23:30 event on its own local day (not UTC)", () => {
    const lateNight = event(
      "a",
      new Date(2026, 5, 16, 23, 30),
      new Date(2026, 5, 17, 0, 30),
    )
    expect(eventsForDay([lateNight], todayMidnight).map((e) => e.id)).toEqual([
      "a",
    ])
  })

  it("tie-breaks equal starts by id", () => {
    const start = new Date(2026, 5, 16, 9, 0)
    const end = new Date(2026, 5, 16, 10, 0)
    const z = event("z", start, end)
    const a = event("a", start, end)
    expect(eventsForDay([z, a], todayMidnight).map((e) => e.id)).toEqual([
      "a",
      "z",
    ])
  })

  it("returns [] when no events fall on the day", () => {
    expect(eventsForDay([], todayMidnight)).toEqual([])
  })
})

describe("dynamicHourRange", () => {
  it("returns the 8–18 fallback when empty", () => {
    expect(dynamicHourRange([])).toEqual({ startHour: 8, endHour: 18 })
  })

  it("spans min start hour .. max end hour + 1", () => {
    const a = event(
      "a",
      new Date(2026, 5, 16, 9, 0),
      new Date(2026, 5, 16, 17, 30),
    )
    expect(dynamicHourRange([a])).toEqual({ startHour: 9, endHour: 18 })
  })

  it("covers cross-hour spans across multiple events", () => {
    const a = event(
      "a",
      new Date(2026, 5, 16, 7, 15),
      new Date(2026, 5, 16, 8, 0),
    )
    const b = event(
      "b",
      new Date(2026, 5, 16, 19, 0),
      new Date(2026, 5, 16, 20, 45),
    )
    expect(dynamicHourRange([a, b])).toEqual({ startHour: 7, endHour: 21 })
  })

  it("clamps the end hour to 24 for a late-ending event", () => {
    const a = event(
      "a",
      new Date(2026, 5, 16, 22, 0),
      new Date(2026, 5, 16, 23, 30),
    )
    expect(dynamicHourRange([a])).toEqual({ startHour: 22, endHour: 24 })
  })
})
