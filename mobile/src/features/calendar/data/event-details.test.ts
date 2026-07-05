// Prove the rich mapper + the reactive read (D3 / D9). The mapper is pure (no db)
// so it is tested directly; useEventDetails runs against a mocked @/db seam (real
// expo-sqlite has no off-device JS) — the live queries are keyed on the table
// token, so we assert the row→domain mapping + the loading/not-found resolution,
// not a real round-trip. Spy names are `mock`-prefixed so the hoisted jest.mock
// factory may reference them.

import { renderHook } from "@testing-library/react-native"

import { rowToEventDetails, useEventDetails } from "./event-details"

// The widened read (ADR 024) queries TWO tables — calendar_events (synced) then
// personal_events (personal). The builder carries the from() table token so
// useLiveQuery returns per-table results.
let mockSyncedLive: { data: unknown[]; updatedAt: Date | undefined } = {
  data: [],
  updatedAt: undefined,
}
let mockPersonalLive: { data: unknown[]; updatedAt: Date | undefined } = {
  data: [],
  updatedAt: undefined,
}

jest.mock("@/db", () => {
  const makeBuilder = (): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      from: (t: { __token?: string }) => {
        builder.__token = t?.__token ?? "calendarEvents"
        return builder
      },
      where: () => builder,
    }
    return builder
  }
  return {
    db: { select: () => makeBuilder() },
    calendarEvents: { uid: "calendarEvents.uid", __token: "calendarEvents" },
    personalEvents: { uid: "personalEvents.uid", __token: "personalEvents" },
    eq: jest.fn((col, val) => ({ op: "eq", col, val })),
    useLiveQuery: (query: { __token?: string }) =>
      query?.__token === "personalEvents" ? mockPersonalLive : mockSyncedLive,
  }
})

// A canonical stored row (the verbatim calendar_events shape).
function row(overrides: Record<string, unknown> = {}) {
  return {
    uid: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    groupColor: "#0D47A1",
    startsAt: "2026-06-16T07:00:00.000Z",
    endsAt: "2026-06-16T08:30:00.000Z",
    exportedAt: "2026-06-15T22:00:00.000Z",
    location: "Room A1",
    description: "Lecture",
    allDay: false,
    teachers: JSON.stringify(["Dr. Turing", "Dr. Lovelace"]),
    tags: JSON.stringify([{ name: "CM", color: "#FF0000", icon: "book" }]),
    fields: JSON.stringify({ canceled: true }),
    type: "cm",
    userCalendarId: "cal-1",
    ...overrides,
  }
}

describe("rowToEventDetails", () => {
  it("keeps groupColor, type, exportedAt and the full tags the lossy domain drops", () => {
    const event = rowToEventDetails(row())
    expect(event.groupColor).toBe("#0D47A1")
    expect(event.type).toBe("cm")
    expect(event.exportedAt).toEqual(new Date("2026-06-15T22:00:00.000Z"))
    expect(event.tags).toEqual([{ name: "CM", color: "#FF0000", icon: "book" }])
    expect(event.teachers).toEqual(["Dr. Turing", "Dr. Lovelace"])
  })

  it("maps ISO TEXT timestamps to Date", () => {
    const event = rowToEventDetails(row())
    expect(event.startsAt).toEqual(new Date("2026-06-16T07:00:00.000Z"))
    expect(event.endsAt).toEqual(new Date("2026-06-16T08:30:00.000Z"))
  })

  it("converts null location/description to undefined", () => {
    const event = rowToEventDetails(row({ location: null, description: null }))
    expect(event.location).toBeUndefined()
    expect(event.description).toBeUndefined()
  })

  it("derives canceled from fields.canceled", () => {
    expect(rowToEventDetails(row()).canceled).toBe(true)
    expect(
      rowToEventDetails(row({ fields: JSON.stringify({}) })).canceled,
    ).toBe(false)
    expect(rowToEventDetails(row({ fields: null })).canceled).toBe(false)
  })

  it("degrades corrupt tags/teachers JSON to [] without throwing", () => {
    const event = rowToEventDetails(
      row({ tags: "not json", teachers: '{"not":"an array"}' }),
    )
    expect(event.tags).toEqual([])
    expect(event.teachers).toEqual([])
  })

  it("degrades corrupt fields JSON to a false canceled without throwing", () => {
    const event = rowToEventDetails(row({ fields: "}{ broken" }))
    expect(event.canceled).toBe(false)
  })

  it("falls back to a safe type for an unknown verbatim value", () => {
    expect(rowToEventDetails(row({ type: "future-kind" })).type).toBe("class")
  })
})

// A personal_events row (no sync-only columns — the personal branch fills defaults).
function personalRow(overrides: Record<string, unknown> = {}) {
  return {
    uid: "pers-1",
    title: "Dentist",
    color: "#E91E63",
    startsAt: "2026-06-16T07:00:00.000Z",
    endsAt: "2026-06-16T08:30:00.000Z",
    exportedAt: "2026-06-15T22:00:00.000Z",
    location: null,
    description: null,
    ...overrides,
  }
}

describe("useEventDetails", () => {
  beforeEach(() => {
    mockSyncedLive = { data: [], updatedAt: undefined }
    mockPersonalLive = { data: [], updatedAt: undefined }
  })

  it("resolves the synced rich event for a present uid", async () => {
    mockSyncedLive = { data: [row()], updatedAt: new Date() }
    mockPersonalLive = { data: [], updatedAt: new Date() }
    const { result } = await renderHook(() => useEventDetails("ev-1"))
    expect(result.current.loading).toBe(false)
    expect(result.current.event?.kind).toBe("synced")
    expect(result.current.event?.groupColor).toBe("#0D47A1")
  })

  it("resolves a personal event when only the personal_events row is present", async () => {
    mockSyncedLive = { data: [], updatedAt: new Date() }
    mockPersonalLive = { data: [personalRow()], updatedAt: new Date() }
    const { result } = await renderHook(() => useEventDetails("pers-1"))
    expect(result.current.loading).toBe(false)
    expect(result.current.event?.kind).toBe("personal")
    expect(result.current.event?.title).toBe("Dentist")
  })

  it("reports loading until BOTH live queries first resolve", async () => {
    mockSyncedLive = { data: [], updatedAt: new Date() }
    mockPersonalLive = { data: [], updatedAt: undefined }
    const { result } = await renderHook(() => useEventDetails("ev-1"))
    expect(result.current.loading).toBe(true)
    expect(result.current.event).toBeNull()
  })

  it("surfaces not-found (both resolved, no row) distinctly from loading", async () => {
    mockSyncedLive = { data: [], updatedAt: new Date() }
    mockPersonalLive = { data: [], updatedAt: new Date() }
    const { result } = await renderHook(() => useEventDetails("missing"))
    expect(result.current.loading).toBe(false)
    expect(result.current.event).toBeNull()
  })

  it("resolves not-found (never loading) for a missing uid", async () => {
    const { result } = await renderHook(() => useEventDetails(undefined))
    expect(result.current.loading).toBe(false)
    expect(result.current.event).toBeNull()
  })
})
