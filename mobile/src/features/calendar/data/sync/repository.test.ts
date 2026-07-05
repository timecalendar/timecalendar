// Prove the repository against the @/db seam, mocked: real expo-sqlite has no
// off-device JS, so we assert the SYNCHRONOUS-TRANSACTIONAL drop+replace
// (replaceAll deletes-then-inserts with `.run()` executors INSIDE one non-async
// db.transaction callback) rather than a real round-trip. The non-async callback
// is load-bearing: the expo driver runs `begin → callback → commit` without
// awaiting, so an async callback would let only the first statement commit (D3) —
// the test asserts the callback is a plain (non-async) function. The shared
// createFakeDb fake overrides the seam with a stateful, spy-instrumented builder
// whose `tx` IS the same instrumented db, so the tx-scoped delete/insert/values
// record to the shared spies. The fake instance is `mock`-prefixed so the hoisted
// jest.mock factory may reference it.

import { createFakeDb } from "@/test-support/fake-db"

// Type-only reference to the seam — a `typeof import(...)` never emits a runtime
// require, so it can't trigger the hoisted jest.mock factory before `mockFake` is
// assigned (a top-level value `import … from "@/db"` would). The runtime table
// token + SUT come from below, after `mockFake` is assigned.
type CalendarEventInsert =
  (typeof import("@/db"))["calendarEvents"]["$inferInsert"]

const mockFake = createFakeDb({
  tables: { calendarEvents: { columns: ["uid"], pk: "uid" } },
})

jest.mock("@/db", () => mockFake.module)

// require() the SUT lazily (not a top-level import) so the eager `@/db` value
// import inside repository.ts can't fire the hoisted factory before `mockFake` is
// assigned. The table token comes from the mocked module.
const { calendarEvents } = mockFake.module as { calendarEvents: unknown }
const { replaceAll } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as typeof import("./repository")

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
  mockFake.reset()
})

describe("calendar-sync repository", () => {
  it("replaceAll deletes-then-inserts inside a single synchronous transaction", async () => {
    await replaceAll([row(), row({ uid: "ev-2" })])

    expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
    // The callback MUST be synchronous (non-async): the expo driver never awaits,
    // so an async callback would break atomicity (D3).
    const txCallback = mockFake.spies.transaction.mock
      .calls[0]?.[0] as () => void
    expect(txCallback.constructor.name).toBe("Function")
    expect(mockFake.spies.delete).toHaveBeenCalledWith(calendarEvents)
    expect(mockFake.spies.insert).toHaveBeenCalledWith(calendarEvents)
    // Every statement runs INSIDE the transaction: the transaction is entered
    // before the drop, and the drop precedes the bulk insert.
    expect(mockFake.spies.transaction.mock.invocationCallOrder[0]).toBeLessThan(
      mockFake.spies.delete.mock.invocationCallOrder[0] ?? Infinity,
    )
    expect(mockFake.spies.delete.mock.invocationCallOrder[0]).toBeLessThan(
      mockFake.spies.insert.mock.invocationCallOrder[0] ?? Infinity,
    )
    const inserted = mockFake.spies.values.mock.calls[0]?.[0] as unknown[]
    expect(inserted).toHaveLength(2)
  })

  it("replaceAll with no events still clears the table in a transaction", async () => {
    await replaceAll([])
    expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
    expect(mockFake.spies.delete).toHaveBeenCalledWith(calendarEvents)
    expect(mockFake.spies.insert).not.toHaveBeenCalled()
  })

  it("replaceAll chunks a large set across multiple inserts in one transaction", async () => {
    const many = Array.from({ length: 120 }, (_, i) => row({ uid: `ev-${i}` }))
    await replaceAll(many)
    expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
    // 120 rows / 50-row chunks = 3 inserts.
    expect(mockFake.spies.insert).toHaveBeenCalledTimes(3)
  })
})
