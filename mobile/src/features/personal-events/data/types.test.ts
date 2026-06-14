import { eventToRow, type PersonalEvent, rowToEvent } from "./types"

// Pure mappers — no SQLite mock. Proves the round-trip (every field preserved,
// timestamps equal, row date strings canonical UTC ISO-8601), null↔undefined
// handling, and the canonical-UTC normalization the D4 range query relies on.

const baseEvent: PersonalEvent = {
  uid: "uid-1",
  title: "Lecture",
  color: "#E91E63",
  startsAt: new Date("2026-06-14T09:00:00.000Z"),
  endsAt: new Date("2026-06-14T10:30:00.000Z"),
  exportedAt: new Date("2026-06-14T08:00:00.000Z"),
  location: "Room 12",
  description: "Bring laptop",
}

describe("personal-events mappers", () => {
  it("round-trips a domain event through eventToRow → rowToEvent", () => {
    const row = eventToRow(baseEvent)
    const back = rowToEvent({
      ...row,
      // $inferInsert widens optionals; the select shape has them present.
      location: row.location ?? null,
      description: row.description ?? null,
    })

    expect(back.uid).toBe(baseEvent.uid)
    expect(back.title).toBe(baseEvent.title)
    expect(back.color).toBe(baseEvent.color)
    expect(back.startsAt.getTime()).toBe(baseEvent.startsAt.getTime())
    expect(back.endsAt.getTime()).toBe(baseEvent.endsAt.getTime())
    expect(back.exportedAt.getTime()).toBe(baseEvent.exportedAt.getTime())
    expect(back.location).toBe(baseEvent.location)
    expect(back.description).toBe(baseEvent.description)
  })

  it("writes canonical UTC ISO-8601 date strings", () => {
    const row = eventToRow(baseEvent)
    expect(row.startsAt).toBe("2026-06-14T09:00:00.000Z")
    expect(row.endsAt).toBe("2026-06-14T10:30:00.000Z")
    expect(row.exportedAt).toBe("2026-06-14T08:00:00.000Z")
  })

  it("normalizes a non-UTC Date to a canonical Z string", () => {
    // A Date built from an offset string still serializes to canonical UTC.
    const row = eventToRow({
      ...baseEvent,
      startsAt: new Date("2026-06-14T11:00:00.000+02:00"),
    })
    expect(row.startsAt).toBe("2026-06-14T09:00:00.000Z")
  })

  it("maps undefined location/description to null on write", () => {
    const row = eventToRow({
      ...baseEvent,
      location: undefined,
      description: undefined,
    })
    expect(row.location).toBeNull()
    expect(row.description).toBeNull()
  })

  it("maps null location/description to undefined on read", () => {
    const back = rowToEvent({
      uid: "uid-2",
      title: "T",
      color: "#000000",
      startsAt: "2026-06-14T09:00:00.000Z",
      endsAt: "2026-06-14T10:00:00.000Z",
      exportedAt: "2026-06-14T08:00:00.000Z",
      location: null,
      description: null,
    })
    expect(back.location).toBeUndefined()
    expect(back.description).toBeUndefined()
  })
})
