// The durability proof CI *can* run, following calendar/data/sync/restart.test.ts:
// the fake's per-table Map "disk" lives in a closure OUTSIDE the jest.mock factory
// and is NOT cleared between the write and the read, standing in for on-disk SQLite
// that survives a process restart. After jest.resetModules() the persisted rows and
// the persisted cursor still read back exactly what the prior module wrote.
//
// This is what makes "pagination survives restarts" a tested claim rather than an
// asserted one: a student who backfills three pages, force-quits the app and comes
// back must resume from page four, not from page two.

import { createFakeDb } from "@/test-support/fake-db"

import type { ActivityLogInsert, ActivityPageWrite } from "./types"

type Repository = typeof import("./repository")
const loadRepository = (): Repository =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as Repository

const mockFake = createFakeDb({
  tables: {
    activityLogs: {
      columns: [
        "id",
        "calendarId",
        "calendarName",
        "changeJson",
        "createdAt",
        "updatedAt",
      ],
    },
    activityState: { columns: ["id"] },
  },
})

jest.mock("@/db", () => ({
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
}))

jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))

const logRow = (id: string, createdAt: string): ActivityLogInsert => ({
  id,
  calendarId: "cal-1",
  calendarName: "L3 Informatique",
  changeJson: JSON.stringify({
    oldItems: [],
    newItems: [],
    changedItems: [],
  }),
  createdAt,
  updatedAt: createdAt,
})

const page = (
  overrides: Partial<ActivityPageWrite> = {},
): ActivityPageWrite => ({
  rows: [],
  asOf: "2026-06-16T12:00:00.000Z",
  heldCalendarIds: ["cal-1"],
  nextCursor: null,
  ...overrides,
})

beforeEach(() => {
  mockFake.reset()
})

describe("activity restart durability", () => {
  it("reads back the cached history after a simulated restart", async () => {
    await loadRepository().storeNewestPage(
      page({
        rows: [
          logRow("log-b", "2026-06-15T09:00:00.000Z"),
          logRow("log-a", "2026-06-16T09:00:00.000Z"),
        ],
        nextCursor: "cursor-2",
      }),
    )

    // Simulate a process restart: drop the module registry, but the "disk" (the
    // fake's store) survives — exactly what on-disk SQLite gives.
    jest.resetModules()

    const restored = await loadRepository().listActivityLogs()
    expect(restored.map((log) => log.id)).toEqual(["log-a", "log-b"])
    expect(restored[0]?.calendarName).toBe("L3 Informatique")
    expect(restored[0]?.change).toEqual({
      oldItems: [],
      newItems: [],
      changedItems: [],
    })
  })

  it("resumes the backfill from the persisted cursor, not from page two", async () => {
    const first = loadRepository()
    await first.storeNewestPage(page({ nextCursor: "cursor-2" }))
    await first.storeOlderPage(page({ nextCursor: "cursor-4" }))

    jest.resetModules()

    const after = loadRepository()
    expect((await after.readActivityState()).olderPageCursor).toBe("cursor-4")
  })

  it("keeps a completed chain complete across a restart", async () => {
    await loadRepository().storeNewestPage(page({ nextCursor: null }))

    jest.resetModules()

    const state = await loadRepository().readActivityState()
    expect(state.olderPageComplete).toBe(true)
    expect(state.olderPageCursor).toBeNull()
  })

  it("keeps the server-issued read watermark across a restart", async () => {
    await loadRepository().markActivityRead("2026-06-16T12:00:00.000Z")

    jest.resetModules()

    const state = await loadRepository().readActivityState()
    expect(state.lastReadAt?.toISOString()).toBe("2026-06-16T12:00:00.000Z")
    expect(state.unreadCount).toBe(0)
  })
})
