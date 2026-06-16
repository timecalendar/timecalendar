import { groupEventsByDay } from "./agenda"
import { type CalendarEvent } from "./types"

function event(id: string, startsAt: Date, endsAt: Date): CalendarEvent {
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
  }
}

// Local-time dates so the local-day bucketing is TZ-independent.
const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m, d, h, min, 0, 0)

describe("groupEventsByDay", () => {
  it("returns [] for empty input", () => {
    expect(groupEventsByDay([])).toEqual([])
  })

  it("buckets events per local calendar day, ascending by day", () => {
    const events = [
      event("c", local(2026, 5, 17, 9), local(2026, 5, 17, 10)),
      event("a", local(2026, 5, 15, 9), local(2026, 5, 15, 10)),
      event("b", local(2026, 5, 16, 9), local(2026, 5, 16, 10)),
    ]
    const result = groupEventsByDay(events)
    expect(result.map((d) => d.day.getDate())).toEqual([15, 16, 17])
    expect(result.every((d) => d.day.getHours() === 0)).toBe(true)
    expect(result.map((d) => d.events.map((e) => e.id))).toEqual([
      ["a"],
      ["b"],
      ["c"],
    ])
  })

  it("sorts events within a day by start time (stable on ties)", () => {
    const events = [
      event("late", local(2026, 5, 15, 14), local(2026, 5, 15, 15)),
      event("early", local(2026, 5, 15, 8), local(2026, 5, 15, 9)),
      // Same start time — stable tie-break by id.
      event("tieB", local(2026, 5, 15, 10), local(2026, 5, 15, 11)),
      event("tieA", local(2026, 5, 15, 10), local(2026, 5, 15, 11)),
    ]
    const result = groupEventsByDay(events)
    expect(result).toHaveLength(1)
    expect(result[0]?.events.map((e) => e.id)).toEqual([
      "early",
      "tieA",
      "tieB",
      "late",
    ])
  })

  it("buckets a late-evening (23:30 local) event on its own local day", () => {
    const events = [
      event("eve", local(2026, 5, 15, 23, 30), local(2026, 5, 16, 0, 30)),
      event("next", local(2026, 5, 16, 9), local(2026, 5, 16, 10)),
    ]
    const result = groupEventsByDay(events)
    expect(result.map((d) => d.day.getDate())).toEqual([15, 16])
    expect(result[0]?.events.map((e) => e.id)).toEqual(["eve"])
    expect(result[1]?.events.map((e) => e.id)).toEqual(["next"])
  })

  it("groups several events on the same day into one bucket", () => {
    const events = [
      event("a", local(2026, 5, 15, 8), local(2026, 5, 15, 9)),
      event("b", local(2026, 5, 15, 10), local(2026, 5, 15, 11)),
    ]
    const result = groupEventsByDay(events)
    expect(result).toHaveLength(1)
    expect(result[0]?.events).toHaveLength(2)
  })
})
