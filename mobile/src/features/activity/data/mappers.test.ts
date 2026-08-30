import type { CalendarChangeGet } from "@/api/generated/timeCalendar.schemas"

import { canonicalIso, dtoToActivityRow, rowToActivityLog } from "./mappers"
import type { ActivityLogDto, ActivityLogRow } from "./types"

// The mappers are PURE — no `db`, no `@/firebase` — so these run against literal
// rows with no SQLite mock at all. The defensive `null` branches are the point:
// a corrupt row must be skippable, never fatal to the whole read.

const change: CalendarChangeGet = {
  oldItems: [
    {
      uid: "ev-old",
      title: "Algorithms",
      startsAt: "2026-06-16T09:00:00.000Z",
      endsAt: "2026-06-16T10:30:00.000Z",
      location: "Room A1",
    },
  ],
  newItems: [
    {
      uid: "ev-new",
      title: "Algorithms",
      startsAt: "2026-06-16T11:00:00.000Z",
      endsAt: "2026-06-16T12:30:00.000Z",
      location: null,
    },
  ],
  changedItems: [],
}

const row = (overrides: Partial<ActivityLogRow> = {}): ActivityLogRow => ({
  id: "log-1",
  calendarId: "cal-1",
  calendarName: "L3 Informatique",
  changeJson: JSON.stringify(change),
  createdAt: "2026-06-16T09:00:00.000Z",
  updatedAt: "2026-06-16T09:05:00.000Z",
  ...overrides,
})

const dto = (overrides: Partial<ActivityLogDto> = {}): ActivityLogDto => ({
  id: "log-1",
  calendarId: "cal-1",
  calendarName: "L3 Informatique",
  calendarChange: change,
  createdAt: "2026-06-16T09:00:00.000Z",
  updatedAt: "2026-06-16T09:05:00.000Z",
  ...overrides,
})

describe("rowToActivityLog", () => {
  it("decodes a stored row into the domain log", () => {
    const log = rowToActivityLog(row())

    expect(log).not.toBeNull()
    expect(log?.id).toBe("log-1")
    expect(log?.calendarId).toBe("cal-1")
    expect(log?.calendarName).toBe("L3 Informatique")
    expect(log?.change).toEqual(change)
    expect(log?.createdAt.toISOString()).toBe("2026-06-16T09:00:00.000Z")
    expect(log?.updatedAt.toISOString()).toBe("2026-06-16T09:05:00.000Z")
  })

  it("round-trips a DTO through the row shape without loss", () => {
    const written = dtoToActivityRow(dto())
    expect(written).not.toBeNull()

    const log = rowToActivityLog(written as ActivityLogRow)
    expect(log?.change).toEqual(change)
    expect(log?.id).toBe(dto().id)
  })

  it("skips a row whose change_json is not JSON at all", () => {
    expect(rowToActivityLog(row({ changeJson: "{not json" }))).toBeNull()
  })

  it.each([
    ["a JSON number", "42"],
    ["a JSON string", '"a change"'],
    ["JSON null", "null"],
    ["a JSON array", "[]"],
  ])("skips a row whose change_json decodes to %s", (_label, changeJson) => {
    expect(rowToActivityLog(row({ changeJson }))).toBeNull()
  })

  it.each(["oldItems", "newItems", "changedItems"])(
    "skips a row whose change payload is missing %s",
    (missing) => {
      const partial: Record<string, unknown> = { ...change }
      delete partial[missing]
      expect(
        rowToActivityLog(row({ changeJson: JSON.stringify(partial) })),
      ).toBeNull()
    },
  )

  it("skips a row whose item collection is not an array", () => {
    const wrong = { ...change, newItems: { uid: "ev" } }
    expect(
      rowToActivityLog(row({ changeJson: JSON.stringify(wrong) })),
    ).toBeNull()
  })
})

describe("dtoToActivityRow", () => {
  it("encodes the change payload as JSON text, verbatim", () => {
    const written = dtoToActivityRow(dto())

    expect(written?.changeJson).toBe(JSON.stringify(change))
    expect(written?.id).toBe("log-1")
    expect(written?.calendarId).toBe("cal-1")
    expect(written?.calendarName).toBe("L3 Informatique")
  })

  // Canonical text is what makes the plain TEXT date columns sort
  // chronologically, which the newest-first read and the age prune both need.
  it("canonicalizes both timestamps to UTC ISO-8601", () => {
    const written = dtoToActivityRow(
      dto({
        createdAt: "2026-06-16T11:00:00+02:00",
        updatedAt: "2026-06-16T09:05:00Z",
      }),
    )

    expect(written?.createdAt).toBe("2026-06-16T09:00:00.000Z")
    expect(written?.updatedAt).toBe("2026-06-16T09:05:00.000Z")
  })

  it("rejects a DTO whose createdAt cannot be parsed", () => {
    expect(dtoToActivityRow(dto({ createdAt: "not a date" }))).toBeNull()
  })

  it("rejects a DTO whose updatedAt cannot be parsed", () => {
    expect(dtoToActivityRow(dto({ updatedAt: "" }))).toBeNull()
  })
})

describe("canonicalIso", () => {
  it("returns canonical UTC text for a parseable timestamp", () => {
    expect(canonicalIso("2026-06-16T11:00:00+02:00")).toBe(
      "2026-06-16T09:00:00.000Z",
    )
  })

  it("returns null for an unparseable timestamp", () => {
    expect(canonicalIso("garbage")).toBeNull()
  })
})
