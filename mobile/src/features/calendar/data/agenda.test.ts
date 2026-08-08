import { groupEventsByDay } from "./agenda"
import { dayKey, minuteOfDayInZone } from "./day-key"
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

// UTC-instant fixtures + a pinned non-device zone (Pacific/Noumea, UTC+11), so
// the bucketing proof is machine-TZ-independent (spec: zone-aware CI proof).
const ZONE = "Pacific/Noumea"

// 09:00 wall clock in Nouméa on the given UTC day+1 is 22:00Z the day before;
// build fixtures directly from Nouméa wall-clock times expressed as instants.
const noumea = (iso: string) => new Date(iso)

describe("groupEventsByDay", () => {
  it("returns [] for empty input", () => {
    expect(groupEventsByDay([], ZONE)).toEqual([])
  })

  it("buckets events per zone calendar day, ascending by day", () => {
    const events = [
      // 09:00–10:00 Nouméa on June 17/15/16 (22:00Z the previous UTC day).
      event(
        "c",
        noumea("2026-06-16T22:00:00Z"),
        noumea("2026-06-16T23:00:00Z"),
      ),
      event(
        "a",
        noumea("2026-06-14T22:00:00Z"),
        noumea("2026-06-14T23:00:00Z"),
      ),
      event(
        "b",
        noumea("2026-06-15T22:00:00Z"),
        noumea("2026-06-15T23:00:00Z"),
      ),
    ]
    const result = groupEventsByDay(events, ZONE)
    expect(result.map((d) => dayKey(d.day, ZONE))).toEqual([
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
    ])
    // Each bucket day is the zone's midnight instant.
    expect(result.every((d) => minuteOfDayInZone(d.day, ZONE) === 0)).toBe(true)
    expect(result.map((d) => d.events.map((e) => e.id))).toEqual([
      ["a"],
      ["b"],
      ["c"],
    ])
  })

  it("sorts events within a day by start time (stable on ties)", () => {
    const events = [
      event(
        "late",
        noumea("2026-06-15T03:00:00Z"),
        noumea("2026-06-15T04:00:00Z"),
      ),
      event(
        "early",
        noumea("2026-06-14T21:00:00Z"),
        noumea("2026-06-14T22:00:00Z"),
      ),
      // Same start time — stable tie-break by id.
      event(
        "tieB",
        noumea("2026-06-14T23:00:00Z"),
        noumea("2026-06-15T00:00:00Z"),
      ),
      event(
        "tieA",
        noumea("2026-06-14T23:00:00Z"),
        noumea("2026-06-15T00:00:00Z"),
      ),
    ]
    const result = groupEventsByDay(events, ZONE)
    expect(result).toHaveLength(1)
    expect(result[0]?.events.map((e) => e.id)).toEqual([
      "early",
      "tieA",
      "tieB",
      "late",
    ])
  })

  it("buckets a 23:30Z instant on the zone's NEXT day (midnight-boundary proof)", () => {
    const events = [
      // 23:30Z June 15 = 10:30 June 16 in Nouméa — the zone's day 16, though a
      // UTC device would call it day 15.
      event(
        "eve",
        noumea("2026-06-15T23:30:00Z"),
        noumea("2026-06-16T00:30:00Z"),
      ),
      // 09:00 Nouméa June 17.
      event(
        "next",
        noumea("2026-06-16T22:00:00Z"),
        noumea("2026-06-16T23:00:00Z"),
      ),
    ]
    const result = groupEventsByDay(events, ZONE)
    expect(result.map((d) => dayKey(d.day, ZONE))).toEqual([
      "2026-06-16",
      "2026-06-17",
    ])
    expect(result[0]?.events.map((e) => e.id)).toEqual(["eve"])
    expect(result[1]?.events.map((e) => e.id)).toEqual(["next"])
  })

  it("groups several events on the same zone day into one bucket", () => {
    const events = [
      event(
        "a",
        noumea("2026-06-14T21:00:00Z"),
        noumea("2026-06-14T22:00:00Z"),
      ),
      event(
        "b",
        noumea("2026-06-14T23:00:00Z"),
        noumea("2026-06-15T00:00:00Z"),
      ),
    ]
    const result = groupEventsByDay(events, ZONE)
    expect(result).toHaveLength(1)
    expect(result[0]?.events).toHaveLength(2)
  })
})
