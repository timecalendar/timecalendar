// Prove the rich mapper + the getByUid query shape (D3 / D9). The mapper is pure
// (no db) so it is tested directly; getByUid runs against a mocked @/db seam (the
// query-builder spy posture from user-calendars/repository.test.ts) — real
// expo-sqlite has no off-device JS, so we assert the Drizzle query SHAPE + the
// row→domain mapping, not a real round-trip. Spy names are `mock`-prefixed so the
// hoisted jest.mock factory may reference them.

import { renderHook } from "@testing-library/react-native"

import { eq } from "@/db"

import { getByUid, rowToEventDetails, useEventDetails } from "./event-details"

// The widened read (ADR 024) queries TWO tables — calendar_events (synced) then
// personal_events (personal). The fake routes a select's rows by the table its
// from() was called with, and useLiveQuery returns per-table results.
let mockSyncedRows: unknown[] = []
let mockPersonalRows: unknown[] = []
const mockWhere = jest.fn()
const mockFrom = jest.fn()
const mockSelect = jest.fn()
// useLiveQuery is keyed on the table token its query referenced.
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
    let token = "calendarEvents"
    const builder: Record<string, unknown> = {
      from: (t: { __token?: string }) => {
        token = t?.__token ?? "calendarEvents"
        builder.__token = token
        mockFrom(t)
        return builder
      },
      where: (...a: unknown[]) => (mockWhere(...a), builder),
      then: (resolve: (value: unknown[]) => unknown) =>
        resolve(token === "personalEvents" ? mockPersonalRows : mockSyncedRows),
    }
    return builder
  }
  return {
    db: {
      select: (...a: unknown[]) => (mockSelect(...a), makeBuilder()),
    },
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

describe("getByUid", () => {
  beforeEach(() => {
    mockSyncedRows = []
    mockPersonalRows = []
    mockSelect.mockClear()
    mockFrom.mockClear()
    mockWhere.mockClear()
    ;(eq as jest.Mock).mockClear()
  })

  it("queries calendar_events by uid through the @/db seam", async () => {
    mockSyncedRows = [row()]
    await getByUid("ev-1")
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(eq).toHaveBeenCalledWith("calendarEvents.uid", "ev-1")
    expect(mockWhere).toHaveBeenCalledWith({
      op: "eq",
      col: "calendarEvents.uid",
      val: "ev-1",
    })
  })

  it("returns the mapped synced rich event for a matching calendar_events row", async () => {
    mockSyncedRows = [row()]
    const event = await getByUid("ev-1")
    expect(event?.kind).toBe("synced")
    expect(event?.id).toBe("ev-1")
    expect(event?.groupColor).toBe("#0D47A1")
  })

  it("falls back to personal_events when no synced row matches", async () => {
    mockSyncedRows = []
    mockPersonalRows = [personalRow()]
    const event = await getByUid("pers-1")
    // Two selects: calendar_events (miss) then personal_events (hit).
    expect(mockSelect).toHaveBeenCalledTimes(2)
    expect(eq).toHaveBeenCalledWith("personalEvents.uid", "pers-1")
    expect(event?.kind).toBe("personal")
    expect(event?.title).toBe("Dentist")
    // The personal branch fills the sync-only defaults.
    expect(event?.groupColor).toBe("#E91E63")
    expect(event?.tags).toEqual([])
    expect(event?.userCalendarId).toBe("")
  })

  it("returns null when no row matches either table", async () => {
    mockSyncedRows = []
    mockPersonalRows = []
    expect(await getByUid("missing")).toBeNull()
  })
})

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
