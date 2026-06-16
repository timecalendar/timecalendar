// Prove the rich mapper + the getByUid query shape (D3 / D9). The mapper is pure
// (no db) so it is tested directly; getByUid runs against a mocked @/db seam (the
// query-builder spy posture from user-calendars/repository.test.ts) — real
// expo-sqlite has no off-device JS, so we assert the Drizzle query SHAPE + the
// row→domain mapping, not a real round-trip. Spy names are `mock`-prefixed so the
// hoisted jest.mock factory may reference them.

import { renderHook } from "@testing-library/react-native"

import { eq } from "@/db"

import { getByUid, rowToEventDetails, useEventDetails } from "./event-details"

let mockRows: unknown[] = []
const mockWhere = jest.fn()
const mockFrom = jest.fn()
const mockSelect = jest.fn()
const mockUseLiveQuery = jest.fn()

jest.mock("@/db", () => {
  const makeBuilder = (): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      from: (...a: unknown[]) => (mockFrom(...a), builder),
      where: (...a: unknown[]) => (mockWhere(...a), builder),
      then: (resolve: (value: unknown[]) => unknown) => resolve(mockRows),
    }
    return builder
  }
  return {
    db: {
      select: (...a: unknown[]) => (mockSelect(...a), makeBuilder()),
    },
    calendarEvents: { uid: "calendarEvents.uid" },
    eq: jest.fn((col, val) => ({ op: "eq", col, val })),
    useLiveQuery: (...a: unknown[]) => mockUseLiveQuery(...a),
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

describe("getByUid", () => {
  beforeEach(() => {
    mockRows = []
    mockSelect.mockClear()
    mockFrom.mockClear()
    mockWhere.mockClear()
    ;(eq as jest.Mock).mockClear()
  })

  it("queries calendar_events by uid through the @/db seam", async () => {
    mockRows = [row()]
    await getByUid("ev-1")
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(eq).toHaveBeenCalledWith("calendarEvents.uid", "ev-1")
    expect(mockWhere).toHaveBeenCalledWith({
      op: "eq",
      col: "calendarEvents.uid",
      val: "ev-1",
    })
  })

  it("returns the mapped rich event for a matching row", async () => {
    mockRows = [row()]
    const event = await getByUid("ev-1")
    expect(event).not.toBeNull()
    expect(event?.id).toBe("ev-1")
    expect(event?.groupColor).toBe("#0D47A1")
  })

  it("returns null when no row matches", async () => {
    mockRows = []
    expect(await getByUid("missing")).toBeNull()
  })
})

describe("useEventDetails", () => {
  it("resolves the rich event for a present uid", async () => {
    mockUseLiveQuery.mockReturnValue({
      data: [row()],
      updatedAt: new Date(),
    })
    const { result } = await renderHook(() => useEventDetails("ev-1"))
    expect(result.current.loading).toBe(false)
    expect(result.current.event?.id).toBe("ev-1")
    expect(result.current.event?.groupColor).toBe("#0D47A1")
  })

  it("reports loading until the live query first resolves", async () => {
    mockUseLiveQuery.mockReturnValue({ data: [], updatedAt: undefined })
    const { result } = await renderHook(() => useEventDetails("ev-1"))
    expect(result.current.loading).toBe(true)
    expect(result.current.event).toBeNull()
  })

  it("surfaces not-found (resolved, no row) distinctly from loading", async () => {
    mockUseLiveQuery.mockReturnValue({ data: [], updatedAt: new Date() })
    const { result } = await renderHook(() => useEventDetails("missing"))
    expect(result.current.loading).toBe(false)
    expect(result.current.event).toBeNull()
  })

  it("resolves not-found (never loading) for a missing uid", async () => {
    mockUseLiveQuery.mockReturnValue({ data: [], updatedAt: undefined })
    const { result } = await renderHook(() => useEventDetails(undefined))
    expect(result.current.loading).toBe(false)
    expect(result.current.event).toBeNull()
  })
})
