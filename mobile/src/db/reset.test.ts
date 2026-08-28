import { createFakeDb } from "@/test-support/fake-db"

import { resetBackendDatabaseWith } from "./reset"

const mockFake = createFakeDb({
  tables: {
    checklistItems: { columns: ["uuid"], pk: "uuid" },
    calendarEvents: { columns: ["uid"], pk: "uid" },
    userCalendars: { columns: ["id"] },
    personalEvents: { columns: ["uid"], pk: "uid" },
  },
})

const tables = {
  checklistItems: mockFake.module.checklistItems,
  calendarEvents: mockFake.module.calendarEvents,
  userCalendars: mockFake.module.userCalendars,
  personalEvents: mockFake.module.personalEvents,
}

beforeEach(() => {
  mockFake.reset()
  mockFake.seed("checklistItems", [{ uuid: "item" }])
  mockFake.seed("calendarEvents", [{ uid: "synced" }])
  mockFake.seed("userCalendars", [{ id: "calendar" }])
  mockFake.seed("personalEvents", [{ uid: "personal" }])
})

it("wipes every backend-owned table in one synchronous transaction", () => {
  resetBackendDatabaseWith(
    mockFake.module.db as unknown as Parameters<
      typeof resetBackendDatabaseWith
    >[0],
    tables,
  )

  expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
  const callback = mockFake.spies.transaction.mock.calls[0]?.[0] as Function
  expect(callback.constructor.name).not.toBe("AsyncFunction")
  expect(mockFake.spies.delete.mock.calls.map(([table]) => table)).toEqual([
    tables.checklistItems,
    tables.calendarEvents,
    tables.userCalendars,
    tables.personalEvents,
  ])
})

it("deletes child/cache tables before identity and local event tables", () => {
  resetBackendDatabaseWith(
    mockFake.module.db as unknown as Parameters<
      typeof resetBackendDatabaseWith
    >[0],
    tables,
  )

  expect(mockFake.spies.delete).toHaveBeenCalledTimes(4)
  const orders = mockFake.spies.delete.mock.invocationCallOrder
  expect(orders[0]).toBeLessThan(orders[1]!)
  expect(orders[1]).toBeLessThan(orders[2]!)
  expect(orders[2]).toBeLessThan(orders[3]!)
})

it("propagates a transaction failure", () => {
  mockFake.spies.transaction.mockImplementationOnce(() => {
    throw new Error("transaction failed")
  })

  expect(() =>
    resetBackendDatabaseWith(
      mockFake.module.db as unknown as Parameters<
        typeof resetBackendDatabaseWith
      >[0],
      tables,
    ),
  ).toThrow("transaction failed")
})
