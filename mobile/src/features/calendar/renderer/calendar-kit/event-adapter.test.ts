import { type CalendarEvent } from "@/features/calendar/data"

import { toCalendarKitEvent } from "./event-adapter"

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "event-1",
    title: "Algorithms",
    color: "#123456",
    startsAt: new Date("2026-05-25T09:00:00.000Z"),
    endsAt: new Date("2026-05-25T10:30:00.000Z"),
    location: "A1",
    allDay: false,
    description: undefined,
    teachers: [],
    tags: [],
    canceled: false,
    userCalendarId: undefined,
    ...overrides,
  }
}

describe("toCalendarKitEvent", () => {
  it("maps timed events to date-time values and preserves the source event", () => {
    const source = event()
    expect(toCalendarKitEvent(source)).toMatchObject({
      id: source.id,
      start: { dateTime: source.startsAt.toISOString() },
      end: { dateTime: source.endsAt.toISOString() },
      source,
    })
  })

  it("maps exclusive all-day ranges to calendar-kit's inclusive floating days", () => {
    expect(
      toCalendarKitEvent(
        event({
          allDay: true,
          startsAt: new Date("2026-05-25T00:00:00.000Z"),
          endsAt: new Date("2026-05-27T00:00:00.000Z"),
        }),
      ),
    ).toMatchObject({
      start: { date: "2026-05-25" },
      end: { date: "2026-05-26" },
    })
  })

  it("does not invert a zero-duration all-day event", () => {
    expect(
      toCalendarKitEvent(
        event({
          allDay: true,
          startsAt: new Date("2026-05-25T00:00:00.000Z"),
          endsAt: new Date("2026-05-25T00:00:00.000Z"),
        }),
      ),
    ).toMatchObject({
      start: { date: "2026-05-25" },
      end: { date: "2026-05-25" },
    })
  })
})
