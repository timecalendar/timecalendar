import { recordUnknownError } from "@/firebase"
import { createFakeDb } from "@/test-support/fake-db"

import type { ActivityLogInsert, ActivityPageWrite } from "./types"

// Driven through the SHARED stateful in-memory @/db harness (createFakeDb), never
// a bespoke Activity mock — the hand-rolled duplication TIM-151 was dispatched to
// remove. The fake's per-table Map "disk" lets a write be read back through the
// production read, so these are behavior tests, not query-shape assertions.
//
// The fake instance is `mock`-prefixed so the hoisted jest.mock factory may
// reference it (babel-plugin-jest-hoist's /^mock/i rule).
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

// The fake stubs the query surface; spread the REAL date primitives back in
// (they are pure, and stubbing them would destroy the mapping oracle).
jest.mock("@/db", () => ({
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
}))

jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))

// require() the SUT lazily (not a top-level import) so its eager `@/db` value
// import can't fire the hoisted jest.mock factory before `mockFake` is assigned.
const {
  clearOlderPageCursor,
  listActivityLogs,
  markActivityRead,
  markActivityReadFromCache,
  pruneToHeldCalendars,
  readActivityState,
  storeNewestPage,
  storeOlderPage,
} =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./repository") as typeof import("./repository")

const mockRecordUnknownError = recordUnknownError as jest.Mock

const CHANGE = { oldItems: [], newItems: [], changedItems: [] }

const logRow = (
  id: string,
  createdAt: string,
  overrides: Partial<ActivityLogInsert> = {},
): ActivityLogInsert => ({
  id,
  calendarId: "cal-1",
  calendarName: "L3 Informatique",
  changeJson: JSON.stringify(CHANGE),
  createdAt,
  updatedAt: createdAt,
  ...overrides,
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

const storedIds = async (): Promise<string[]> =>
  (await listActivityLogs()).map((log) => log.id)

beforeEach(() => {
  mockFake.reset()
  mockRecordUnknownError.mockClear()
  jest.useRealTimers()
})

describe("state defaults", () => {
  it("reads the documented defaults when no state row exists", async () => {
    await expect(readActivityState()).resolves.toEqual({
      lastReadAt: null,
      unreadCount: 0,
      lastSuccessfulRefreshAt: null,
      olderPageCursor: null,
      olderPageComplete: false,
    })
  })
})

describe("page upsert", () => {
  it("stores a first page and reads it back newest first", async () => {
    await storeNewestPage(
      page({
        rows: [
          logRow("log-a", "2026-06-14T09:00:00.000Z"),
          logRow("log-c", "2026-06-16T09:00:00.000Z"),
          logRow("log-b", "2026-06-15T09:00:00.000Z"),
        ],
      }),
    )

    expect(await storedIds()).toEqual(["log-c", "log-b", "log-a"])
  })

  // The second order key breaks ties deterministically, so the list does not
  // reshuffle between reads when two logs share a server timestamp.
  it("breaks equal timestamps by id, descending", async () => {
    await storeNewestPage(
      page({
        rows: [
          logRow("log-a", "2026-06-16T09:00:00.000Z"),
          logRow("log-c", "2026-06-16T09:00:00.000Z"),
          logRow("log-b", "2026-06-16T09:00:00.000Z"),
        ],
      }),
    )

    expect(await storedIds()).toEqual(["log-c", "log-b", "log-a"])
  })

  it("updates a repeated page in place instead of duplicating", async () => {
    const first = page({ rows: [logRow("log-a", "2026-06-16T09:00:00.000Z")] })
    await storeNewestPage(first)
    await storeNewestPage(
      page({
        rows: [
          logRow("log-a", "2026-06-16T09:00:00.000Z", {
            calendarName: "Renamed",
          }),
        ],
      }),
    )

    const logs = await listActivityLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]?.calendarName).toBe("Renamed")
  })

  // The whole reason the cache is merged rather than drop+replaced: a backfilled
  // older page must survive, and an overlap must not duplicate.
  it("merges an overlapping older page without losing rows outside it", async () => {
    await storeNewestPage(
      page({
        rows: [
          logRow("log-c", "2026-06-16T09:00:00.000Z"),
          logRow("log-b", "2026-06-15T09:00:00.000Z"),
        ],
        nextCursor: "cursor-2",
      }),
    )
    await storeOlderPage(
      page({
        rows: [
          logRow("log-b", "2026-06-15T09:00:00.000Z"),
          logRow("log-a", "2026-06-14T09:00:00.000Z"),
        ],
        nextCursor: "cursor-3",
      }),
    )

    expect(await storedIds()).toEqual(["log-c", "log-b", "log-a"])
  })

  // A newest-page refresh must never behave like calendar_events' drop+replace.
  it("a newest-page refresh keeps the backfilled older rows", async () => {
    await storeOlderPage(
      page({
        rows: [logRow("log-old", "2026-06-01T09:00:00.000Z")],
        nextCursor: "cursor-2",
      }),
    )
    await storeNewestPage(
      page({ rows: [logRow("log-new", "2026-06-16T09:00:00.000Z")] }),
    )

    expect(await storedIds()).toEqual(["log-new", "log-old"])
  })
})

describe("transaction shape", () => {
  // Every writer, one shape: exactly one transaction, and a SYNCHRONOUS
  // callback. The expo driver never awaits, so an async callback would let
  // BEGIN/COMMIT bracket only the first statement — the atomicity would be a lie.
  it.each([
    [
      "storeNewestPage",
      () =>
        storeNewestPage(
          page({ rows: [logRow("log-a", "2026-06-16T09:00:00.000Z")] }),
        ),
    ],
    ["clearOlderPageCursor", () => clearOlderPageCursor()],
    ["markActivityRead", () => markActivityRead("2026-06-16T12:00:00.000Z")],
    ["markActivityReadFromCache", () => markActivityReadFromCache()],
  ])("%s writes in exactly one synchronous transaction", async (_l, run) => {
    await run()

    expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
    const callback = mockFake.spies.transaction.mock.calls[0]?.[0] as Function
    expect(callback.constructor.name).not.toBe("AsyncFunction")
  })

  // Every write lives inside the transaction callback, so a transaction that
  // never runs leaves BOTH the rows and the state exactly as they were — the
  // cursor cannot advance past a page that was not stored.
  it("leaves rows and state untouched when the transaction fails", async () => {
    await storeNewestPage(
      page({
        rows: [logRow("log-a", "2026-06-16T09:00:00.000Z")],
        nextCursor: "cursor-2",
      }),
    )
    const before = await readActivityState()

    mockFake.spies.transaction.mockImplementationOnce(() => {
      throw new Error("transaction failed")
    })
    await expect(
      storeOlderPage(
        page({
          rows: [logRow("log-b", "2026-06-15T09:00:00.000Z")],
          nextCursor: "cursor-3",
        }),
      ),
    ).rejects.toThrow("transaction failed")

    expect(await storedIds()).toEqual(["log-a"])
    await expect(readActivityState()).resolves.toEqual(before)
  })
})

describe("one-year retention", () => {
  it("prunes rows older than a year before the server snapshot", async () => {
    await storeNewestPage(
      page({
        asOf: "2026-06-16T12:00:00.000Z",
        rows: [
          logRow("fresh", "2026-06-16T09:00:00.000Z"),
          logRow("edge", "2025-06-17T09:00:00.000Z"),
          logRow("stale", "2025-06-15T09:00:00.000Z"),
        ],
      }),
    )

    expect(await storedIds()).toEqual(["fresh", "edge"])
  })

  // An older-page write carries its chain's snapshot-bound asOf, which is at most
  // the newest one. Taking the max of it and the newest cached server timestamp
  // means it prunes at the same boundary rather than under-pruning.
  it("prunes at the newest cached timestamp when the write's asOf is older", async () => {
    await storeNewestPage(
      page({
        asOf: "2026-06-16T12:00:00.000Z",
        rows: [logRow("fresh", "2026-06-16T09:00:00.000Z")],
        nextCursor: "cursor-2",
      }),
    )
    await storeOlderPage(
      page({
        asOf: "2025-01-01T00:00:00.000Z",
        rows: [logRow("stale", "2025-06-15T09:00:00.000Z")],
      }),
    )

    expect(await storedIds()).toEqual(["fresh"])
  })

  // The whole point of deriving the cutoff from server time: a wrong device clock
  // must not be able to delete a year of history, nor to keep stale rows alive.
  it.each([
    ["set far forward", "2031-01-01T00:00:00.000Z"],
    ["set far backward", "2001-01-01T00:00:00.000Z"],
  ])("prunes the same set with a device clock %s", async (_label, now) => {
    jest.useFakeTimers().setSystemTime(new Date(now))

    await storeNewestPage(
      page({
        asOf: "2026-06-16T12:00:00.000Z",
        rows: [
          logRow("fresh", "2026-06-16T09:00:00.000Z"),
          logRow("stale", "2025-06-15T09:00:00.000Z"),
        ],
      }),
    )

    expect(await storedIds()).toEqual(["fresh"])
  })

  // A single unorderable timestamp must degrade to "no trusted time", not throw
  // and take the whole page write down.
  it("skips the age prune when no trusted server time exists", async () => {
    await storeNewestPage(
      page({
        asOf: "not a date",
        rows: [logRow("kept", "2026-06-16T09:00:00.000Z", { createdAt: "" })],
      }),
    )

    // Nothing was deleted against a garbage cutoff — the row is still there.
    expect(mockFake.spies.lt).not.toHaveBeenCalled()
    expect(await storedIds()).toEqual(["kept"])
  })

  it("still prunes when only the cached rows carry a trusted timestamp", async () => {
    await storeNewestPage(
      page({
        asOf: "not a date",
        rows: [
          logRow("fresh", "2026-06-16T09:00:00.000Z"),
          logRow("stale", "2025-06-15T09:00:00.000Z"),
        ],
      }),
    )

    expect(await storedIds()).toEqual(["fresh"])
  })
})

describe("calendar removal", () => {
  it("deletes only the rows of a calendar the device no longer holds", async () => {
    await storeNewestPage(
      page({
        heldCalendarIds: ["cal-1", "cal-2"],
        rows: [
          logRow("keep-1", "2026-06-16T09:00:00.000Z"),
          logRow("keep-2", "2026-06-15T09:00:00.000Z", { calendarId: "cal-2" }),
          logRow("drop", "2026-06-14T09:00:00.000Z", { calendarId: "cal-3" }),
        ],
      }),
    )

    expect(await storedIds()).toEqual(["keep-1", "keep-2"])
  })

  it("removes a calendar's rows on the next write once it is no longer held", async () => {
    await storeNewestPage(
      page({
        heldCalendarIds: ["cal-1", "cal-2"],
        rows: [
          logRow("a", "2026-06-16T09:00:00.000Z"),
          logRow("b", "2026-06-15T09:00:00.000Z", { calendarId: "cal-2" }),
        ],
      }),
    )
    await storeNewestPage(page({ heldCalendarIds: ["cal-1"] }))

    expect(await storedIds()).toEqual(["a"])
  })

  // `NOT IN ()` is not valid SQL, and "the device holds no calendars" genuinely
  // means no Activity row is owned.
  it("empties the table when the device holds no calendars", async () => {
    await storeNewestPage(
      page({ rows: [logRow("a", "2026-06-16T09:00:00.000Z")] }),
    )
    await storeNewestPage(page({ heldCalendarIds: [] }))

    expect(await storedIds()).toEqual([])
  })
})

// The removal-driven ownership prune (TIM-397 / D7). It exists because the prune
// normally rides a page write, and no page is written when the device holds no
// calendars — so a student who removes their LAST calendar would otherwise keep
// that calendar's history cached forever.
describe("standalone ownership prune", () => {
  const seedTwoCalendars = async (): Promise<void> => {
    await storeNewestPage(
      page({
        heldCalendarIds: ["cal-1", "cal-2"],
        rows: [
          logRow("keep", "2026-06-16T09:00:00.000Z"),
          logRow("drop", "2026-06-15T09:00:00.000Z", { calendarId: "cal-2" }),
        ],
        nextCursor: "cursor-2",
        unreadCount: 4,
        lastSuccessfulRefreshAt: new Date("2026-06-16T12:00:05.000Z"),
      }),
    )
  }

  it("deletes only the removed calendar's rows", async () => {
    await seedTwoCalendars()

    await pruneToHeldCalendars(["cal-1"])

    expect(await storedIds()).toEqual(["keep"])
  })

  it("empties the table when the last calendar is removed", async () => {
    await seedTwoCalendars()

    await pruneToHeldCalendars([])

    expect(await storedIds()).toEqual([])
  })

  it("keeps every row when nothing was removed", async () => {
    await seedTwoCalendars()

    await pruneToHeldCalendars(["cal-1", "cal-2"])

    expect(await storedIds()).toEqual(["keep", "drop"])
  })

  // It is the ownership prune ALONE: no watermark, no unread count, no refresh
  // timestamp, no cursor, no completion flag. It needs no server `asOf`, which
  // is the whole point — it must work when no request was issued at all.
  it("writes no state at all", async () => {
    await seedTwoCalendars()
    await markActivityRead("2026-06-16T08:00:00.000Z")
    await storeNewestPage(page({ unreadCount: 6, nextCursor: "cursor-2" }))
    const before = await readActivityState()

    await pruneToHeldCalendars([])

    await expect(readActivityState()).resolves.toEqual(before)
  })

  it("prunes in exactly one synchronous transaction", async () => {
    await seedTwoCalendars()
    mockFake.spies.transaction.mockClear()

    await pruneToHeldCalendars(["cal-1"])

    expect(mockFake.spies.transaction).toHaveBeenCalledTimes(1)
    const callback = mockFake.spies.transaction.mock.calls[0]?.[0] as Function
    expect(callback.constructor.name).not.toBe("AsyncFunction")
  })
})

describe("older-page cursor lifecycle", () => {
  it("stores the first page's cursor on an empty cache", async () => {
    await storeNewestPage(page({ nextCursor: "cursor-2" }))

    const state = await readActivityState()
    expect(state.olderPageCursor).toBe("cursor-2")
    expect(state.olderPageComplete).toBe(false)
  })

  it("marks the chain complete when the whole history fits one page", async () => {
    await storeNewestPage(page({ nextCursor: null }))

    const state = await readActivityState()
    expect(state.olderPageCursor).toBeNull()
    expect(state.olderPageComplete).toBe(true)
  })

  // A partial backfill must not restart from page two.
  it("a newest-page refresh preserves an already stored cursor", async () => {
    await storeNewestPage(page({ nextCursor: "cursor-2" }))
    await storeOlderPage(page({ nextCursor: "cursor-3" }))
    await storeNewestPage(page({ nextCursor: "cursor-2" }))

    expect((await readActivityState()).olderPageCursor).toBe("cursor-3")
  })

  it("a newest-page refresh does not reopen a completed chain", async () => {
    await storeNewestPage(page({ nextCursor: null }))
    await storeNewestPage(page({ nextCursor: "cursor-2" }))

    const state = await readActivityState()
    expect(state.olderPageComplete).toBe(true)
    expect(state.olderPageCursor).toBeNull()
  })

  it("an older-page write overwrites the cursor", async () => {
    await storeNewestPage(page({ nextCursor: "cursor-2" }))
    await storeOlderPage(page({ nextCursor: "cursor-3" }))

    expect((await readActivityState()).olderPageCursor).toBe("cursor-3")
  })

  it("an older page with no next cursor completes the chain", async () => {
    await storeNewestPage(page({ nextCursor: "cursor-2" }))
    await storeOlderPage(page({ nextCursor: null }))

    const state = await readActivityState()
    expect(state.olderPageCursor).toBeNull()
    expect(state.olderPageComplete).toBe(true)
  })

  it("a failed write does not advance the cursor", async () => {
    await storeNewestPage(page({ nextCursor: "cursor-2" }))

    mockFake.spies.transaction.mockImplementationOnce(() => {
      throw new Error("transaction failed")
    })
    await expect(
      storeOlderPage(page({ nextCursor: "cursor-3" })),
    ).rejects.toThrow("transaction failed")

    expect((await readActivityState()).olderPageCursor).toBe("cursor-2")
  })

  // The server rejected the stored cursor: restart the chain from the newest
  // page, and keep every cached row — the history stays readable offline, and the
  // upsert identity makes the repeated pages harmless.
  it("clearOlderPageCursor resets the chain without deleting rows", async () => {
    await storeNewestPage(
      page({
        rows: [
          logRow("a", "2026-06-16T09:00:00.000Z"),
          logRow("b", "2026-06-15T09:00:00.000Z"),
        ],
        nextCursor: "cursor-2",
      }),
    )
    await clearOlderPageCursor()

    const state = await readActivityState()
    expect(state.olderPageCursor).toBeNull()
    expect(state.olderPageComplete).toBe(false)
    expect(await storedIds()).toEqual(["a", "b"])
  })

  it("re-adopts a cursor after the chain was reset", async () => {
    await storeNewestPage(page({ nextCursor: "cursor-2" }))
    await clearOlderPageCursor()
    await storeNewestPage(page({ nextCursor: "cursor-fresh" }))

    expect((await readActivityState()).olderPageCursor).toBe("cursor-fresh")
  })
})

describe("read state", () => {
  it("markActivityRead stores the server asOf and clears the count", async () => {
    await storeNewestPage(page({ unreadCount: 4 }))
    await markActivityRead("2026-06-16T12:00:00.000Z")

    const state = await readActivityState()
    expect(state.lastReadAt?.toISOString()).toBe("2026-06-16T12:00:00.000Z")
    expect(state.unreadCount).toBe(0)
  })

  it("markActivityRead canonicalizes a non-UTC asOf", async () => {
    await markActivityRead("2026-06-16T14:00:00+02:00")

    expect((await readActivityState()).lastReadAt?.toISOString()).toBe(
      "2026-06-16T12:00:00.000Z",
    )
  })

  it("markActivityRead leaves the watermark alone for an unparseable asOf", async () => {
    await markActivityRead("2026-06-16T12:00:00.000Z")
    await markActivityRead("not a date")

    const state = await readActivityState()
    expect(state.lastReadAt?.toISOString()).toBe("2026-06-16T12:00:00.000Z")
    expect(state.unreadCount).toBe(0)
  })

  // Advancing the watermark on a passive refresh would mark unseen changes read.
  it("a page write stores the unread count without touching the watermark", async () => {
    await markActivityRead("2026-06-16T08:00:00.000Z")
    await storeNewestPage(page({ unreadCount: 3 }))

    const state = await readActivityState()
    expect(state.unreadCount).toBe(3)
    expect(state.lastReadAt?.toISOString()).toBe("2026-06-16T08:00:00.000Z")
  })

  it("a page write with no unread count preserves the stored one", async () => {
    await storeNewestPage(page({ unreadCount: 5 }))
    await storeNewestPage(page())

    expect((await readActivityState()).unreadCount).toBe(5)
  })

  it("a page write stores the caller's device-time refresh timestamp", async () => {
    const refreshedAt = new Date("2026-06-16T12:00:05.000Z")
    await storeNewestPage(page({ lastSuccessfulRefreshAt: refreshedAt }))

    const state = await readActivityState()
    expect(state.lastSuccessfulRefreshAt?.toISOString()).toBe(
      refreshedAt.toISOString(),
    )
    // The two clocks stay apart: a device-time refresh stamp must never leak
    // into the server-time watermark.
    expect(state.lastReadAt).toBeNull()
  })

  it("a page write with no refresh timestamp preserves the stored one", async () => {
    await storeNewestPage(
      page({ lastSuccessfulRefreshAt: new Date("2026-06-16T12:00:05.000Z") }),
    )
    await storeNewestPage(page())

    expect(
      (await readActivityState()).lastSuccessfulRefreshAt?.toISOString(),
    ).toBe("2026-06-16T12:00:05.000Z")
  })

  it("markActivityReadFromCache advances only to the newest cached server time", async () => {
    await storeNewestPage(
      page({
        rows: [
          logRow("a", "2026-06-16T09:00:00.000Z"),
          logRow("b", "2026-06-15T09:00:00.000Z"),
        ],
        unreadCount: 2,
      }),
    )
    await markActivityReadFromCache()

    const state = await readActivityState()
    expect(state.lastReadAt?.toISOString()).toBe("2026-06-16T09:00:00.000Z")
    expect(state.unreadCount).toBe(0)
  })

  it("markActivityReadFromCache never moves the watermark backwards", async () => {
    await storeNewestPage(
      page({ rows: [logRow("a", "2026-06-15T09:00:00.000Z")] }),
    )
    await markActivityRead("2026-06-16T12:00:00.000Z")
    await markActivityReadFromCache()

    expect((await readActivityState()).lastReadAt?.toISOString()).toBe(
      "2026-06-16T12:00:00.000Z",
    )
  })

  it("markActivityReadFromCache clears the count with an empty cache", async () => {
    await storeNewestPage(page({ unreadCount: 7 }))
    await markActivityReadFromCache()

    const state = await readActivityState()
    expect(state.unreadCount).toBe(0)
    expect(state.lastReadAt).toBeNull()
  })

  // The negative test that pins architecture decision 8: no operation may write a
  // device-clock value into lastReadAt. A phone whose clock is set forward would
  // otherwise sit ahead of every server row and never show an unread change again.
  it("no operation writes a device-clock value into lastReadAt", async () => {
    const deviceNow = "2031-03-04T05:06:07.000Z"
    jest.useFakeTimers().setSystemTime(new Date(deviceNow))

    await storeNewestPage(
      page({
        rows: [logRow("a", "2026-06-16T09:00:00.000Z")],
        unreadCount: 2,
        nextCursor: "cursor-2",
        lastSuccessfulRefreshAt: new Date(),
      }),
    )
    await storeOlderPage(page({ rows: [], nextCursor: null }))
    await clearOlderPageCursor()
    await markActivityReadFromCache()
    await markActivityRead("2026-06-16T12:00:00.000Z")

    const state = await readActivityState()
    expect(state.lastReadAt?.toISOString()).not.toBe(deviceNow)
    expect(state.lastReadAt?.toISOString()).toBe("2026-06-16T12:00:00.000Z")
  })
})

describe("malformed row recording", () => {
  it("skips an undecodable row and still returns the good ones", async () => {
    await storeNewestPage(
      page({
        rows: [
          logRow("good", "2026-06-16T09:00:00.000Z"),
          logRow("bad", "2026-06-15T09:00:00.000Z", { changeJson: "{oops" }),
        ],
      }),
    )

    expect(await storedIds()).toEqual(["good"])
  })

  it("records the skip once per read, with a static context", async () => {
    await storeNewestPage(
      page({
        rows: [
          logRow("bad-1", "2026-06-16T09:00:00.000Z", { changeJson: "{oops" }),
          logRow("bad-2", "2026-06-15T09:00:00.000Z", { changeJson: "nope" }),
        ],
      }),
    )
    await listActivityLogs()

    expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "activity/decode",
    )
  })

  it("records nothing when every row decodes", async () => {
    await storeNewestPage(
      page({ rows: [logRow("good", "2026-06-16T09:00:00.000Z")] }),
    )
    await listActivityLogs()

    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  // The privacy rule is a hard constraint: tokens, event titles, locations,
  // descriptions, calendar ids and log ids never reach Crashlytics. Only a count.
  it("carries no identifying content into the recorded error", async () => {
    const secret = "Salle B203 — Partiel de cryptographie"
    await storeNewestPage(
      page({
        heldCalendarIds: ["cal-secret-id"],
        rows: [
          logRow("log-secret-id", "2026-06-16T09:00:00.000Z", {
            calendarId: "cal-secret-id",
            calendarName: "M2 Cryptographie",
            changeJson: `{"oldItems": [{"location": "${secret}"`,
          }),
        ],
      }),
    )
    await listActivityLogs()

    const [error, context] = mockRecordUnknownError.mock.calls[0] as [
      Error,
      string,
    ]
    const recorded = `${error.message} ${context}`
    for (const forbidden of [
      "log-secret-id",
      "cal-secret-id",
      "M2 Cryptographie",
      secret,
      "Salle",
      "cryptographie",
    ]) {
      expect(recorded).not.toContain(forbidden)
    }
    expect(recorded).toContain("1")
  })
})
