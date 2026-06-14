// Prove each repository function against the @/db seam, mocked (D8): real
// expo-sqlite has no off-device JS, so we assert the Drizzle query SHAPE and the
// row→domain mapping rather than a real round-trip (that is on-device — the
// Maestro launch runs the real CREATE TABLE). A local jest.mock("@/db")
// overrides the seam with a query-builder spy. Spy names are `mock`-prefixed so
// the hoisted jest.mock factory may reference them.

// Rows the awaited query chain resolves to (settable per test).
import { and, eq, gte, lte, personalEvents } from "@/db"

import { findAll, findInRange, getById, remove, upsert } from "./repository"
import { eventToRow, type PersonalEvent } from "./types"

let mockRows: unknown[] = []
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockFrom = jest.fn()
const mockValues = jest.fn()
const mockOnConflict = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockDelete = jest.fn()

jest.mock("@/db", () => {
  // A chainable builder that is also thenable: chain methods return it, and
  // awaiting it resolves to mockRows.
  const makeBuilder = (): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      from: (...a: unknown[]) => (mockFrom(...a), builder),
      where: (...a: unknown[]) => (mockWhere(...a), builder),
      orderBy: (...a: unknown[]) => (mockOrderBy(...a), builder),
      values: (...a: unknown[]) => (mockValues(...a), builder),
      onConflictDoUpdate: (...a: unknown[]) => (mockOnConflict(...a), builder),
      then: (resolve: (value: unknown[]) => unknown) => resolve(mockRows),
    }
    return builder
  }
  return {
    db: {
      select: (...a: unknown[]) => (mockSelect(...a), makeBuilder()),
      insert: (...a: unknown[]) => (mockInsert(...a), makeBuilder()),
      delete: (...a: unknown[]) => (mockDelete(...a), makeBuilder()),
    },
    personalEvents: {
      uid: "personalEvents.uid",
      startsAt: "personalEvents.startsAt",
      endsAt: "personalEvents.endsAt",
    },
    eq: jest.fn((col, val) => ({ op: "eq", col, val })),
    and: jest.fn((...conds) => ({ op: "and", conds })),
    gte: jest.fn((col, val) => ({ op: "gte", col, val })),
    lte: jest.fn((col, val) => ({ op: "lte", col, val })),
  }
})

const event: PersonalEvent = {
  uid: "uid-1",
  title: "Lecture",
  color: "#E91E63",
  startsAt: new Date("2026-06-14T09:00:00.000Z"),
  endsAt: new Date("2026-06-14T10:30:00.000Z"),
  exportedAt: new Date("2026-06-14T08:00:00.000Z"),
  location: "Room 12",
  description: undefined,
}

const rowOf = (e: PersonalEvent) => ({
  uid: e.uid,
  title: e.title,
  color: e.color,
  startsAt: e.startsAt.toISOString(),
  endsAt: e.endsAt.toISOString(),
  exportedAt: e.exportedAt.toISOString(),
  location: e.location ?? null,
  description: e.description ?? null,
})

beforeEach(() => {
  mockRows = []
  ;[
    mockWhere,
    mockOrderBy,
    mockFrom,
    mockValues,
    mockOnConflict,
    mockSelect,
    mockInsert,
    mockDelete,
  ].forEach((m) => m.mockClear())
})

describe("personal-events repository", () => {
  it("findAll selects all rows and maps them to domain", async () => {
    mockRows = [rowOf(event)]
    const result = await findAll()
    expect(mockSelect).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith(personalEvents)
    expect(result).toHaveLength(1)
    expect(result[0]?.uid).toBe("uid-1")
    expect(result[0]?.startsAt).toBeInstanceOf(Date)
  })

  it("getById selects by uid and maps the row, or returns undefined", async () => {
    mockRows = [rowOf(event)]
    const found = await getById("uid-1")
    expect(eq).toHaveBeenCalledWith(personalEvents.uid, "uid-1")
    expect(mockWhere).toHaveBeenCalled()
    expect(found?.uid).toBe("uid-1")

    mockRows = []
    expect(await getById("missing")).toBeUndefined()
  })

  it("upsert inserts with onConflictDoUpdate by uid using the mapped row", async () => {
    await upsert(event)
    expect(mockInsert).toHaveBeenCalledWith(personalEvents)
    expect(mockValues).toHaveBeenCalledWith(eventToRow(event))
    expect(mockOnConflict).toHaveBeenCalledWith({
      target: personalEvents.uid,
      set: eventToRow(event),
    })
  })

  it("remove deletes by uid", async () => {
    await remove("uid-1")
    expect(mockDelete).toHaveBeenCalledWith(personalEvents)
    expect(eq).toHaveBeenCalledWith(personalEvents.uid, "uid-1")
    expect(mockWhere).toHaveBeenCalled()
  })

  it("findInRange issues the gte/lte range, orders by start, maps to domain", async () => {
    const earlier: PersonalEvent = {
      ...event,
      uid: "uid-early",
      startsAt: new Date("2026-06-14T08:00:00.000Z"),
      endsAt: new Date("2026-06-14T08:30:00.000Z"),
    }
    // The builder returns rows already DB-ordered; assert mapping preserves
    // order and the bounds are the canonical ISO strings.
    mockRows = [rowOf(earlier), rowOf(event)]
    const from = new Date("2026-06-14T00:00:00.000Z")
    const to = new Date("2026-06-15T00:00:00.000Z")
    const result = await findInRange(from, to)

    expect(lte).toHaveBeenCalledWith(personalEvents.startsAt, to.toISOString())
    expect(gte).toHaveBeenCalledWith(personalEvents.endsAt, from.toISOString())
    expect(and).toHaveBeenCalled()
    expect(mockOrderBy).toHaveBeenCalledWith(personalEvents.startsAt)
    expect(result.map((e) => e.uid)).toEqual(["uid-early", "uid-1"])
  })
})
