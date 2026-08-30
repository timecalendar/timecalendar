import { createFakeDb } from "@/test-support/fake-db"

import { resetBackendDatabaseWith } from "./reset"

const mockFake = createFakeDb({
  tables: {
    checklistItems: { columns: ["uuid"], pk: "uuid" },
    activityLogs: { columns: ["id"] },
    activityState: { columns: ["id"] },
    calendarEvents: { columns: ["uid"], pk: "uid" },
    userCalendars: { columns: ["id"] },
    personalEvents: { columns: ["uid"], pk: "uid" },
  },
})

const tables = {
  checklistItems: mockFake.module.checklistItems,
  activityLogs: mockFake.module.activityLogs,
  activityState: mockFake.module.activityState,
  calendarEvents: mockFake.module.calendarEvents,
  userCalendars: mockFake.module.userCalendars,
  personalEvents: mockFake.module.personalEvents,
}

beforeEach(() => {
  mockFake.reset()
  mockFake.seed("checklistItems", [{ uuid: "item" }])
  mockFake.seed("activityLogs", [{ id: "log" }])
  mockFake.seed("activityState", [{ id: 1 }])
  mockFake.seed("calendarEvents", [{ uid: "synced" }])
  mockFake.seed("userCalendars", [{ id: "calendar" }])
  mockFake.seed("personalEvents", [{ uid: "personal" }])
})

const runReset = () =>
  resetBackendDatabaseWith(
    mockFake.module.db as unknown as Parameters<
      typeof resetBackendDatabaseWith
    >[0],
    tables,
  )

const readAll = async (table: unknown): Promise<unknown[]> => {
  const db = mockFake.module.db as {
    select: () => { from: (t: unknown) => Promise<unknown[]> }
  }
  return db.select().from(table)
}

it("wipes every backend-owned table in one synchronous transaction", () => {
  runReset()

  expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
  const callback = mockFake.spies.transaction.mock.calls[0]?.[0] as Function
  expect(callback.constructor.name).not.toBe("AsyncFunction")
  expect(mockFake.spies.delete.mock.calls.map(([table]) => table)).toEqual([
    tables.checklistItems,
    tables.activityLogs,
    tables.activityState,
    tables.calendarEvents,
    tables.userCalendars,
    tables.personalEvents,
  ])
})

// The environment-switch proof: a table missing here leaves another
// environment's private schedule data on the device. `switch.ts` calls
// resetBackendDatabase(), which calls this — there is exactly ONE list, so this
// assertion covers the environment switch too.
it("leaves every seeded backend-owned table empty, Activity included", async () => {
  runReset()

  for (const table of Object.values(tables)) {
    await expect(readAll(table)).resolves.toEqual([])
  }
})

it("deletes child/cache tables before identity and local event tables", () => {
  runReset()

  expect(mockFake.spies.delete).toHaveBeenCalledTimes(6)
  const orders = mockFake.spies.delete.mock.invocationCallOrder
  for (let i = 1; i < orders.length; i += 1) {
    expect(orders[i - 1]).toBeLessThan(orders[i]!)
  }
})

it("propagates a transaction failure", () => {
  mockFake.spies.transaction.mockImplementationOnce(() => {
    throw new Error("transaction failed")
  })

  expect(() => runReset()).toThrow("transaction failed")
})
