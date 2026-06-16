// Prove the repository against the @/db seam, mocked: real expo-sqlite has no
// off-device JS, so we assert the Drizzle query SHAPE (findInRange) and the
// TRANSACTIONAL drop+replace (replaceAll deletes-then-inserts INSIDE one
// db.transaction callback) rather than a real round-trip. A local jest.mock("@/db")
// overrides the seam with a chainable query-builder + a transaction spy. Spy names
// are `mock`-prefixed so the hoisted jest.mock factory may reference them.

import { and, calendarEvents, gte, lte } from "@/db"

import { findInRange, replaceAll } from "./repository"

type CalendarEventInsert = typeof calendarEvents.$inferInsert

let mockRows: unknown[] = []
const mockWhere = jest.fn()
const mockFrom = jest.fn()
const mockSelect = jest.fn()
// Transaction-scoped spies (the `tx` builder inside db.transaction).
const mockTxDelete = jest.fn()
const mockTxInsert = jest.fn()
const mockTxValues = jest.fn()
const mockTransaction = jest.fn()

jest.mock("@/db", () => {
  const makeSelectBuilder = (): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      from: (...a: unknown[]) => (mockFrom(...a), builder),
      where: (...a: unknown[]) => (mockWhere(...a), builder),
      then: (resolve: (value: unknown[]) => unknown) => resolve(mockRows),
    }
    return builder
  }
  const tx = {
    delete: (...a: unknown[]) => {
      mockTxDelete(...a)
      return { then: (r: (v: unknown) => unknown) => r(undefined) }
    },
    insert: (...a: unknown[]) => {
      mockTxInsert(...a)
      return {
        values: (...v: unknown[]) => {
          mockTxValues(...v)
          return { then: (r: (val: unknown) => unknown) => r(undefined) }
        },
      }
    },
  }
  return {
    db: {
      select: (...a: unknown[]) => (mockSelect(...a), makeSelectBuilder()),
      transaction: (cb: (t: typeof tx) => Promise<unknown>) => {
        mockTransaction()
        return cb(tx)
      },
    },
    calendarEvents: {
      startsAt: "calendarEvents.startsAt",
      endsAt: "calendarEvents.endsAt",
    },
    and: jest.fn((...conds: unknown[]) => ({ op: "and", conds })),
    gte: jest.fn((col, val) => ({ op: "gte", col, val })),
    lte: jest.fn((col, val) => ({ op: "lte", col, val })),
  }
})

// replaceAll takes verbatim INSERT rows now (dtoToRow's output), not domain events.
function row(
  overrides: Partial<CalendarEventInsert> = {},
): CalendarEventInsert {
  return {
    uid: "ev-1",
    title: "Algorithms",
    color: "#1E88E5",
    groupColor: "#0D47A1",
    startsAt: "2026-06-16T09:00:00.000Z",
    endsAt: "2026-06-16T10:30:00.000Z",
    exportedAt: "2026-06-15T08:00:00.000Z",
    location: "Room A1",
    description: null,
    allDay: false,
    teachers: "[]",
    tags: "[]",
    fields: null,
    type: "cm",
    userCalendarId: "cal-1",
    ...overrides,
  }
}

beforeEach(() => {
  mockRows = []
  ;[
    mockWhere,
    mockFrom,
    mockSelect,
    mockTxDelete,
    mockTxInsert,
    mockTxValues,
    mockTransaction,
  ].forEach((m) => m.mockClear())
})

describe("calendar-sync repository", () => {
  it("findInRange selects with the overlap query and maps rows to domain", async () => {
    const from = new Date("2026-06-16T00:00:00.000Z")
    const to = new Date("2026-06-17T00:00:00.000Z")
    mockRows = [
      {
        uid: "ev-1",
        title: "Algorithms",
        color: "#1E88E5",
        groupColor: "#1E88E5",
        startsAt: "2026-06-16T09:00:00.000Z",
        endsAt: "2026-06-16T10:30:00.000Z",
        exportedAt: "2026-06-15T08:00:00.000Z",
        location: "Room A1",
        description: null,
        allDay: false,
        teachers: "[]",
        tags: "[]",
        fields: null,
        type: "cm",
        userCalendarId: "cal-1",
      },
    ]

    const result = await findInRange(from, to)

    expect(mockSelect).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith(calendarEvents)
    expect(mockWhere).toHaveBeenCalled()
    // The overlap query: start <= to AND end >= from, on the ISO bounds.
    expect(lte).toHaveBeenCalledWith(calendarEvents.startsAt, to.toISOString())
    expect(gte).toHaveBeenCalledWith(calendarEvents.endsAt, from.toISOString())
    expect(and).toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe("ev-1")
    expect(result[0]?.startsAt).toBeInstanceOf(Date)
  })

  it("replaceAll deletes-then-inserts inside a single transaction", async () => {
    await replaceAll([row(), row({ uid: "ev-2" })])

    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockTxDelete).toHaveBeenCalledWith(calendarEvents)
    expect(mockTxInsert).toHaveBeenCalledWith(calendarEvents)
    // delete is issued before any insert (the drop precedes the bulk insert).
    expect(mockTxDelete.mock.invocationCallOrder[0]).toBeLessThan(
      mockTxInsert.mock.invocationCallOrder[0] ?? Infinity,
    )
    const inserted = mockTxValues.mock.calls[0]?.[0] as unknown[]
    expect(inserted).toHaveLength(2)
  })

  it("replaceAll with no events still clears the table in a transaction", async () => {
    await replaceAll([])
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockTxDelete).toHaveBeenCalledWith(calendarEvents)
    expect(mockTxInsert).not.toHaveBeenCalled()
  })

  it("replaceAll chunks a large set across multiple inserts in one transaction", async () => {
    const many = Array.from({ length: 120 }, (_, i) => row({ uid: `ev-${i}` }))
    await replaceAll(many)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    // 120 rows / 50-row chunks = 3 inserts.
    expect(mockTxInsert).toHaveBeenCalledTimes(3)
  })
})
