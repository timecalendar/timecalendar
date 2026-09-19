import { classifyTimedEventSupport } from "./timed-support"
import type { CalendarEvent, TimedCalendarEventV1 } from "./types"

function timed(startsAt: string, endsAt: string): TimedCalendarEventV1 {
  return {
    version: 1,
    kind: "timed",
    allDay: false,
    identity: { source: "synced", uid: "event-1" },
    id: "event-1",
    title: "Maths",
    color: "#112233",
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    location: "B12",
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: "cal-1",
  }
}

describe("classifyTimedEventSupport", () => {
  it("supports a same-day interval and the exact exclusive midnight boundary", () => {
    expect(
      classifyTimedEventSupport(
        timed("2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z"),
        "Europe/Paris",
      ).supported,
    ).toBe(true)
    expect(
      classifyTimedEventSupport(
        timed("2026-09-14T21:00:00Z", "2026-09-14T22:00:00Z"),
        "Europe/Paris",
      ).supported,
    ).toBe(true)
  })

  it("classifies deferred date-only, instant, spanning, and DST shapes", () => {
    const dateOnly: CalendarEvent = {
      ...timed("2026-09-14T00:00:00Z", "2026-09-15T00:00:00Z"),
      kind: "date-only",
      allDay: true,
      startDay: "2026-09-14",
      endDay: "2026-09-15",
    }
    expect(classifyTimedEventSupport(dateOnly, "UTC")).toEqual({
      supported: false,
      reason: "date-only",
    })
    expect(
      classifyTimedEventSupport(
        timed("2026-09-14T08:00:00Z", "2026-09-14T08:00:00Z"),
        "UTC",
      ),
    ).toEqual({ supported: false, reason: "instant" })
    expect(
      classifyTimedEventSupport(
        timed("2026-09-14T22:00:00Z", "2026-09-15T01:00:00Z"),
        "UTC",
      ),
    ).toEqual({ supported: false, reason: "spanning" })
    expect(
      classifyTimedEventSupport(
        timed("2026-03-29T00:30:00Z", "2026-03-29T02:30:00Z"),
        "Europe/Paris",
      ),
    ).toEqual({ supported: false, reason: "offset-transition" })
    expect(
      classifyTimedEventSupport(
        timed("2026-10-25T00:30:00Z", "2026-10-25T02:30:00Z"),
        "Europe/Paris",
      ),
    ).toEqual({ supported: false, reason: "offset-transition" })
  })

  it("returns a stable unsupported reason for an invalid zone", () => {
    expect(
      classifyTimedEventSupport(
        timed("2026-09-14T08:00:00Z", "2026-09-14T09:00:00Z"),
        "Not/AZone",
      ),
    ).toEqual({ supported: false, reason: "spanning" })
  })
})
