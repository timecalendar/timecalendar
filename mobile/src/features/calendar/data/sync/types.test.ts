import type { CalendarEventForPublic } from "@/api/generated/timeCalendar.schemas"
import { calendarEvents } from "@/db"
import type { CalendarEvent } from "@/features/calendar/data/types"

import {
  calendarEventToRow,
  fromCalendarEventDto,
  rowToCalendarEvent,
} from "./types"

type CalendarEventRow = typeof calendarEvents.$inferSelect

// Coerce an INSERT row (optional fields) into a SELECT row (string | null) so the
// row mappers' input matches the $inferSelect shape rowToCalendarEvent reads.
function toRow(
  event: CalendarEvent,
  overrides: Partial<CalendarEventRow> = {},
): CalendarEventRow {
  const row = calendarEventToRow(event)
  return {
    uid: row.uid,
    title: row.title,
    color: row.color,
    groupColor: row.groupColor,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    exportedAt: row.exportedAt,
    location: row.location ?? null,
    description: row.description ?? null,
    allDay: row.allDay,
    teachers: row.teachers,
    tags: row.tags,
    fields: row.fields ?? null,
    type: row.type,
    userCalendarId: row.userCalendarId,
    ...overrides,
  }
}

// The mappers are pure (no `db`), so they unit-test without any SQLite mock. They
// own the TEXT-ISO + JSON-as-TEXT storage format (ADR 021): canonical-UTC
// normalization, JSON encode/decode (incl. the DEFENSIVE decode that degrades a
// corrupt value to a safe default rather than throwing), null↔undefined, boolean,
// and the importer-fidelity-verbatim DTO mapper.

function domainEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    startsAt: new Date("2026-06-16T09:00:00.000Z"),
    endsAt: new Date("2026-06-16T10:30:00.000Z"),
    location: "Room A1",
    allDay: false,
    description: "Lecture",
    teachers: ["Dr. Ada"],
    tags: ["CM"],
    canceled: false,
    userCalendarId: "cal-1",
    ...overrides,
  }
}

function dtoEvent(
  overrides: Partial<CalendarEventForPublic> = {},
): CalendarEventForPublic {
  return {
    type: "cm",
    color: "#1E88E5",
    groupColor: "#0D47A1",
    uid: "srv-ev-1",
    title: "Algorithms",
    startsAt: "2026-06-16T09:00:00.000Z",
    endsAt: "2026-06-16T10:30:00.000Z",
    location: "Room A1",
    allDay: false,
    description: "Lecture",
    teachers: ["Dr. Ada", "Mr. Turing"],
    tags: [{ name: "CM", color: "#FF0000", icon: "book" }],
    fields: { canceled: false, subject: "CS" },
    exportedAt: "2026-06-15T08:00:00.000Z",
    ...overrides,
  }
}

describe("calendarEventToRow / rowToCalendarEvent", () => {
  it("round-trips a domain event through the row mappers", () => {
    const event = domainEvent()
    const back = rowToCalendarEvent(toRow(event))
    expect(back.id).toBe(event.id)
    expect(back.title).toBe(event.title)
    expect(back.color).toBe(event.color)
    expect(back.startsAt.getTime()).toBe(event.startsAt.getTime())
    expect(back.endsAt.getTime()).toBe(event.endsAt.getTime())
    expect(back.location).toBe(event.location)
    expect(back.description).toBe(event.description)
    expect(back.allDay).toBe(false)
    expect(back.teachers).toEqual(event.teachers)
    expect(back.tags).toEqual(event.tags)
    expect(back.canceled).toBe(false)
    expect(back.userCalendarId).toBe(event.userCalendarId)
  })

  it("normalizes every written date to canonical UTC ISO-8601", () => {
    const row = calendarEventToRow(
      domainEvent({ startsAt: new Date("2026-06-16T09:00:00+02:00") }),
    )
    expect(row.startsAt).toBe("2026-06-16T07:00:00.000Z")
    expect(row.startsAt.endsWith("Z")).toBe(true)
  })

  it("encodes the JSON columns and round-trips them", () => {
    const event = domainEvent({ teachers: ["A", "B"] })
    expect(JSON.parse(calendarEventToRow(event).teachers)).toEqual(["A", "B"])
    expect(rowToCalendarEvent(toRow(event)).teachers).toEqual(["A", "B"])
  })

  it("maps null location/description to undefined", () => {
    const event = domainEvent({ location: undefined, description: undefined })
    const row = calendarEventToRow(event)
    expect(row.location).toBeNull()
    expect(row.description).toBeNull()
    const back = rowToCalendarEvent(toRow(event))
    expect(back.location).toBeUndefined()
    expect(back.description).toBeUndefined()
  })

  it("derives canceled from the fields blob", () => {
    expect(
      rowToCalendarEvent(toRow(domainEvent({ canceled: true }))).canceled,
    ).toBe(true)
  })

  it("decodes corrupt JSON columns to safe defaults without throwing", () => {
    const corrupt = toRow(domainEvent(), {
      teachers: "{not json",
      tags: "also broken]",
      fields: "}}}",
    })
    expect(() => rowToCalendarEvent(corrupt)).not.toThrow()
    const back = rowToCalendarEvent(corrupt)
    expect(back.teachers).toEqual([])
    expect(back.tags).toEqual([])
    expect(back.canceled).toBe(false)
  })

  it("decodes a non-array JSON value to an empty array", () => {
    const back = rowToCalendarEvent(
      toRow(domainEvent(), { teachers: JSON.stringify({ not: "an array" }) }),
    )
    expect(back.teachers).toEqual([])
  })

  it("decodes a null fields column to canceled=false", () => {
    expect(
      rowToCalendarEvent(toRow(domainEvent(), { fields: null })).canceled,
    ).toBe(false)
  })

  it("decodes a non-object (valid JSON) fields value to canceled=false", () => {
    // Valid JSON but not an object (a bare number) → safe default, not a throw.
    expect(
      rowToCalendarEvent(toRow(domainEvent(), { fields: "42" })).canceled,
    ).toBe(false)
  })
})

describe("fromCalendarEventDto", () => {
  it("maps a server event DTO to a domain event with its parent calendar id", () => {
    const event = fromCalendarEventDto(dtoEvent(), "cal-parent")
    expect(event.id).toBe("srv-ev-1")
    expect(event.title).toBe("Algorithms")
    expect(event.color).toBe("#1E88E5")
    expect(event.startsAt.getTime()).toBe(
      new Date("2026-06-16T09:00:00.000Z").getTime(),
    )
    expect(event.location).toBe("Room A1")
    expect(event.allDay).toBe(false)
    expect(event.teachers).toEqual(["Dr. Ada", "Mr. Turing"])
    expect(event.tags).toEqual(["CM"])
    expect(event.canceled).toBe(false)
    expect(event.userCalendarId).toBe("cal-parent")
  })

  it("maps a null DTO location/description/fields to undefined/false", () => {
    const event = fromCalendarEventDto(
      dtoEvent({ location: null, description: null, fields: null }),
      "cal-1",
    )
    expect(event.location).toBeUndefined()
    expect(event.description).toBeUndefined()
    expect(event.canceled).toBe(false)
  })

  it("preserves a canceled flag from the DTO fields", () => {
    const event = fromCalendarEventDto(
      dtoEvent({ fields: { canceled: true } }),
      "cal-1",
    )
    expect(event.canceled).toBe(true)
  })

  it("stores DTO dates verbatim (already canonical UTC) when re-serialized", () => {
    // Importer-fidelity: a DTO date round-trips to the same canonical string.
    const event = fromCalendarEventDto(dtoEvent(), "cal-1")
    const row = calendarEventToRow(event)
    expect(row.startsAt).toBe("2026-06-16T09:00:00.000Z")
  })
})
