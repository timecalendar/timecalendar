import { type CalendarEvent } from "@/features/calendar/data"

import {
  dayCaption,
  dynamicHourRange,
  eventsForDay,
  greetingSelection,
  nextActiveDay,
  remainingEvents,
  splitDayEvents,
} from "./selectors"

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

const now = new Date(2026, 5, 16, 12, 0)

// The machine's own zone: fixtures below are device-local Dates, so passing the
// machine zone preserves their intent on any CI host. The non-device-zone
// proofs live in the dedicated describe at the bottom.
const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

describe("home selectors", () => {
  it("keeps Home on today and sorts that day's events", () => {
    const later = event(
      "z",
      new Date(2026, 5, 16, 14),
      new Date(2026, 5, 16, 15),
    )
    const earlier = event(
      "a",
      new Date(2026, 5, 16, 9),
      new Date(2026, 5, 16, 10),
    )
    const tomorrow = event(
      "b",
      new Date(2026, 5, 17, 9),
      new Date(2026, 5, 17, 10),
    )
    expect(
      eventsForDay([later, tomorrow, earlier], now, ZONE).map(
        (item) => item.id,
      ),
    ).toEqual(["a", "z"])
  })

  it("tie-breaks equal event starts by id", () => {
    const start = new Date(2026, 5, 16, 9)
    const end = new Date(2026, 5, 16, 10)
    expect(
      eventsForDay(
        [event("z", start, end), event("a", start, end)],
        now,
        ZONE,
      ).map((item) => item.id),
    ).toEqual(["a", "z"])
  })

  it("includes events that intersect today from either midnight boundary", () => {
    const overnight = event(
      "overnight",
      new Date(2026, 5, 15, 23, 30),
      new Date(2026, 5, 16, 0, 30),
    )
    const multiDay = event(
      "multi-day",
      new Date(Date.UTC(2026, 5, 15)),
      new Date(Date.UTC(2026, 5, 18)),
      { allDay: true },
    )
    expect(
      eventsForDay([overnight, multiDay], now, ZONE).map((item) => item.id),
    ).toEqual(["multi-day", "overnight"])
  })

  it("returns only ongoing, future, and all-day events as remaining", () => {
    const past = event(
      "past",
      new Date(2026, 5, 16, 8),
      new Date(2026, 5, 16, 9),
    )
    const ongoing = event(
      "ongoing",
      new Date(2026, 5, 16, 11),
      new Date(2026, 5, 16, 13),
    )
    const allDay = event("all", new Date(2026, 5, 16), new Date(2026, 5, 17), {
      allDay: true,
    })
    expect(
      remainingEvents([past, ongoing, allDay], now).map((item) => item.id),
    ).toEqual(["ongoing", "all"])
  })

  it("splits all-day events out of the timed timeline", () => {
    const timed = event(
      "timed",
      new Date(2026, 5, 16, 9),
      new Date(2026, 5, 16, 10),
    )
    const allDay = event("all", new Date(2026, 5, 16), new Date(2026, 5, 17), {
      allDay: true,
    })
    expect(splitDayEvents([timed, allDay])).toEqual({
      allDay: [allDay],
      timed: [timed],
    })
  })

  it("summarizes the first future active day", () => {
    const first = event(
      "first",
      new Date(2026, 5, 18, 8, 30),
      new Date(2026, 5, 18, 10),
    )
    const second = event(
      "second",
      new Date(2026, 5, 18, 14),
      new Date(2026, 5, 18, 15),
    )
    const result = nextActiveDay([second, first], now, ZONE)
    expect(result?.events).toHaveLength(2)
    expect(result?.firstTimedStart).toEqual(first.startsAt)
    expect(nextActiveDay([], now, ZONE)).toBeUndefined()
    const allDay = event(
      "all",
      new Date(Date.UTC(2026, 5, 17)),
      new Date(Date.UTC(2026, 5, 18)),
      { allDay: true },
    )
    expect(nextActiveDay([allDay], now, ZONE)?.firstTimedStart).toBeUndefined()
    const allDayResult = nextActiveDay([allDay], now, ZONE)
    expect(allDayResult?.day).not.toBe(allDay.startsAt)
    expect(allDayResult?.day.getFullYear()).toBe(2026)
    expect(allDayResult?.day.getMonth()).toBe(5)
    expect(allDayResult?.day.getDate()).toBe(17)
    expect(allDayResult?.day.getHours()).toBe(0)
  })

  it("selects stable weekday and weekend greetings by time period", () => {
    const weekday = greetingSelection(new Date(2026, 5, 16, 10))
    expect(weekday).toEqual({ period: "morning", weekend: false, variant: 0 })
    const weekend = greetingSelection(new Date(2026, 5, 20, 22))
    expect(weekend).toEqual({ period: "night", weekend: true, variant: 0 })
    expect(
      [6, 10, 12, 15, 19, 23].map(
        (hour) => greetingSelection(new Date(2026, 5, 17, hour)).period,
      ),
    ).toEqual(["early", "morning", "midday", "afternoon", "evening", "night"])
    expect(greetingSelection(new Date(2026, 5, 17, 10)).variant).toBe(1)
  })

  it("describes empty, all-day, ongoing, future, and finished schedules", () => {
    expect(dayCaption([], now)).toEqual({ kind: "empty" })
    const allDay = event("all", new Date(2026, 5, 16), new Date(2026, 5, 17), {
      allDay: true,
    })
    expect(dayCaption([allDay], now)).toEqual({ kind: "allDayOnly" })
    const ongoing = event(
      "ongoing",
      new Date(2026, 5, 16, 11),
      new Date(2026, 5, 16, 13),
    )
    expect(dayCaption([ongoing], now)).toEqual({
      kind: "ongoing",
      end: ongoing.endsAt,
    })
    const future = event(
      "future",
      new Date(2026, 5, 16, 14),
      new Date(2026, 5, 16, 15),
    )
    expect(dayCaption([future], now)).toEqual({
      kind: "singleFuture",
      start: future.startsAt,
      end: future.endsAt,
    })
    const later = event(
      "later",
      new Date(2026, 5, 16, 16),
      new Date(2026, 5, 16, 18),
    )
    expect(dayCaption([future, later], now)).toEqual({
      kind: "futureSpan",
      start: future.startsAt,
      end: later.endsAt,
    })
    const shorter = event(
      "shorter",
      new Date(2026, 5, 16, 17),
      new Date(2026, 5, 16, 17, 30),
    )
    expect(dayCaption([future, later, shorter], now)).toEqual({
      kind: "futureSpan",
      start: future.startsAt,
      end: later.endsAt,
    })
    const past = event(
      "past",
      new Date(2026, 5, 16, 8),
      new Date(2026, 5, 16, 9),
    )
    expect(dayCaption([past], now)).toEqual({ kind: "finished" })
  })

  it("builds a timed-only dynamic range and handles cross-midnight", () => {
    const timed = event(
      "timed",
      new Date(2026, 5, 16, 9, 15),
      new Date(2026, 5, 16, 17, 30),
    )
    const allDay = event("all", new Date(2026, 5, 16), new Date(2026, 5, 17), {
      allDay: true,
    })
    expect(dynamicHourRange([timed, allDay], now, ZONE)).toEqual({
      startHour: 9,
      endHour: 18,
    })
    const late = event(
      "late",
      new Date(2026, 5, 16, 23, 30),
      new Date(2026, 5, 17, 0, 30),
    )
    expect(dynamicHourRange([late], now, ZONE)).toEqual({
      startHour: 23,
      endHour: 24,
    })
    expect(dynamicHourRange([allDay], now, ZONE)).toEqual({
      startHour: 8,
      endHour: 18,
    })
    const exactHour = event(
      "exact",
      new Date(2026, 5, 16, 9),
      new Date(2026, 5, 16, 10),
    )
    expect(dynamicHourRange([exactHour], now, ZONE)).toEqual({
      startHour: 9,
      endHour: 10,
    })
    const fromYesterday = event(
      "from-yesterday",
      new Date(2026, 5, 15, 23),
      new Date(2026, 5, 16, 2),
    )
    expect(dynamicHourRange([fromYesterday], now, ZONE)).toEqual({
      startHour: 0,
      endHour: 2,
    })
  })
})

// The non-device-zone proofs (spec: day bucketing follows the display zone;
// greeting stays device-local). Fixtures are UTC instants; the zone is pinned
// to Nouméa (UTC+11), never the machine TZ.
describe("home selectors under a non-device display zone", () => {
  const NOUMEA = "Pacific/Noumea"

  it("buckets a 23:30Z event on the ZONE's next day", () => {
    // 23:30Z June 15 = 10:30 June 16 in Nouméa.
    const lateUtc = event(
      "late-utc",
      new Date("2026-06-15T23:30:00.000Z"),
      new Date("2026-06-16T00:30:00.000Z"),
    )
    // "Today" is Nouméa June 16 (02:00Z on the 16th = 13:00 local).
    const noumeaNow = new Date("2026-06-16T02:00:00.000Z")
    expect(
      eventsForDay([lateUtc], noumeaNow, NOUMEA).map((item) => item.id),
    ).toEqual(["late-utc"])
    // Tahiti (UTC−10) still has that instant on ITS June 15 — its June 16
    // (20:00Z on the 16th = 10:00 local) does not contain the event.
    const tahitiJune16 = new Date("2026-06-16T20:00:00.000Z")
    expect(eventsForDay([lateUtc], tahitiJune16, "Pacific/Tahiti")).toEqual([])
  })

  it("keeps an all-day event on its floating UTC day in any zone", () => {
    const allDay = event(
      "all",
      new Date(Date.UTC(2026, 5, 16)),
      new Date(Date.UTC(2026, 5, 17)),
      { allDay: true },
    )
    // Each zone's OWN June 16 shows the floating June 16 all-day event.
    const noumeaJune16 = new Date("2026-06-16T02:00:00.000Z")
    expect(
      eventsForDay([allDay], noumeaJune16, NOUMEA).map((item) => item.id),
    ).toEqual(["all"])
    const tahitiJune16 = new Date("2026-06-16T20:00:00.000Z")
    expect(
      eventsForDay([allDay], tahitiJune16, "Pacific/Tahiti").map(
        (item) => item.id,
      ),
    ).toEqual(["all"])
  })

  it("computes the dynamic hour range on the zone's wall clock", () => {
    // 22:00Z–23:30Z = 09:00–10:30 in Nouméa.
    const morning = event(
      "morning",
      new Date("2026-06-15T22:00:00.000Z"),
      new Date("2026-06-15T23:30:00.000Z"),
    )
    const noumeaNow = new Date("2026-06-16T02:00:00.000Z")
    expect(dynamicHourRange([morning], noumeaNow, NOUMEA)).toEqual({
      startHour: 9,
      endHour: 11,
    })
  })

  it("greeting stays on the DEVICE clock regardless of the display zone", () => {
    // greetingSelection takes no zone: the device-local hour decides. 10:00
    // device-local is "morning" even though Nouméa's wall clock differs.
    const deviceMorning = new Date(2026, 5, 16, 10)
    expect(greetingSelection(deviceMorning).period).toBe("morning")
  })
})
