import type { CalendarEventForPublic } from "@/api/generated/timeCalendar.schemas"
import { calendarEvents } from "@/db"

import { dtoToRow, rowToCalendarEvent } from "./types"

type CalendarEventRow = typeof calendarEvents.$inferSelect

// Coerce a dtoToRow INSERT row (optional fields) into a SELECT row (string | null)
// so the row reader's input matches the $inferSelect shape rowToCalendarEvent reads.
function toRow(
  dto: CalendarEventForPublic,
  userCalendarId = "cal-1",
  overrides: Partial<CalendarEventRow> = {},
): CalendarEventRow {
  const row = dtoToRow(dto, userCalendarId)
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
// own the TEXT-ISO + JSON-as-TEXT storage format (ADR 021): the VERBATIM DTO→row
// write (no data loss), canonical-UTC normalization, JSON encode/decode (incl. the
// DEFENSIVE decode that degrades a corrupt value to a safe default rather than
// throwing), null↔undefined, and the lossy row→domain rendering projection.

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
    fields: { canceled: false, subject: "CS", shortDescription: "Algo" },
    exportedAt: "2026-06-15T08:00:00.000Z",
    ...overrides,
  }
}

describe("dtoToRow", () => {
  it("writes the DTO to a row VERBATIM — no data loss", () => {
    const row = dtoToRow(dtoEvent(), "cal-parent")
    expect(row.uid).toBe("srv-ev-1")
    expect(row.title).toBe("Algorithms")
    expect(row.color).toBe("#1E88E5")
    // groupColor is the DTO's own value, NOT a mirror of color.
    expect(row.groupColor).toBe("#0D47A1")
    // type is the real enum value, NOT a fabricated "class".
    expect(row.type).toBe("cm")
    expect(row.location).toBe("Room A1")
    expect(row.description).toBe("Lecture")
    expect(row.allDay).toBe(false)
    expect(row.userCalendarId).toBe("cal-parent")
  })

  it("preserves the FULL rich tag objects (name + color + icon)", () => {
    const tags = JSON.parse(dtoToRow(dtoEvent(), "cal-1").tags)
    expect(tags).toEqual([{ name: "CM", color: "#FF0000", icon: "book" }])
  })

  it("preserves the FULL fields object (subject, shortDescription, canceled)", () => {
    const fields = JSON.parse(dtoToRow(dtoEvent(), "cal-1").fields ?? "null")
    expect(fields).toEqual({
      canceled: false,
      subject: "CS",
      shortDescription: "Algo",
    })
  })

  it("encodes the teachers array as JSON", () => {
    expect(JSON.parse(dtoToRow(dtoEvent(), "cal-1").teachers)).toEqual([
      "Dr. Ada",
      "Mr. Turing",
    ])
  })

  it("normalizes every written date to canonical UTC ISO-8601", () => {
    const row = dtoToRow(
      dtoEvent({ startsAt: "2026-06-16T09:00:00+02:00" }),
      "cal-1",
    )
    expect(row.startsAt).toBe("2026-06-16T07:00:00.000Z")
    expect(row.startsAt.endsWith("Z")).toBe(true)
  })

  it("stores a DTO date verbatim when it is already canonical UTC", () => {
    // Importer-fidelity: a canonical-UTC DTO date is a no-op normalization.
    expect(dtoToRow(dtoEvent(), "cal-1").startsAt).toBe(
      "2026-06-16T09:00:00.000Z",
    )
  })

  it("maps a null DTO location/description/fields to null in the row", () => {
    const row = dtoToRow(
      dtoEvent({ location: null, description: null, fields: null }),
      "cal-1",
    )
    expect(row.location).toBeNull()
    expect(row.description).toBeNull()
    expect(row.fields).toBeNull()
  })
})

describe("rowToCalendarEvent", () => {
  it("maps a stored row to the (lossy) rendering domain event", () => {
    const back = rowToCalendarEvent(toRow(dtoEvent()))
    expect(back.id).toBe("srv-ev-1")
    expect(back.title).toBe("Algorithms")
    expect(back.color).toBe("#1E88E5")
    expect(back.startsAt.getTime()).toBe(
      new Date("2026-06-16T09:00:00.000Z").getTime(),
    )
    expect(back.endsAt.getTime()).toBe(
      new Date("2026-06-16T10:30:00.000Z").getTime(),
    )
    expect(back.location).toBe("Room A1")
    expect(back.description).toBe("Lecture")
    expect(back.allDay).toBe(false)
    expect(back.teachers).toEqual(["Dr. Ada", "Mr. Turing"])
    // The domain projects the rich tags to names for rendering.
    expect(back.tags).toEqual(["CM"])
    expect(back.canceled).toBe(false)
    expect(back.userCalendarId).toBe("cal-1")
  })

  it("maps null location/description to undefined", () => {
    const back = rowToCalendarEvent(
      toRow(dtoEvent({ location: null, description: null })),
    )
    expect(back.location).toBeUndefined()
    expect(back.description).toBeUndefined()
  })

  it("derives canceled from the fields blob", () => {
    expect(
      rowToCalendarEvent(toRow(dtoEvent({ fields: { canceled: true } })))
        .canceled,
    ).toBe(true)
  })

  it("decodes corrupt JSON columns to safe defaults without throwing", () => {
    const corrupt = toRow(dtoEvent(), "cal-1", {
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
      toRow(dtoEvent(), "cal-1", {
        teachers: JSON.stringify({ not: "an array" }),
      }),
    )
    expect(back.teachers).toEqual([])
  })

  it("decodes a null fields column to canceled=false", () => {
    expect(
      rowToCalendarEvent(toRow(dtoEvent(), "cal-1", { fields: null })).canceled,
    ).toBe(false)
  })

  it("decodes a non-object (valid JSON) fields value to canceled=false", () => {
    // Valid JSON but not an object (a bare number) → safe default, not a throw.
    expect(
      rowToCalendarEvent(toRow(dtoEvent(), "cal-1", { fields: "42" })).canceled,
    ).toBe(false)
  })

  it("degrades a non-boolean canceled to false (field-level defensive decode)", () => {
    // A corrupt/legacy { canceled: "yes" } must NOT reach the domain as a truthy
    // non-boolean — `=== true` coerces it to false.
    expect(
      rowToCalendarEvent(
        toRow(dtoEvent(), "cal-1", {
          fields: JSON.stringify({ canceled: "yes" }),
        }),
      ).canceled,
    ).toBe(false)
  })
})
