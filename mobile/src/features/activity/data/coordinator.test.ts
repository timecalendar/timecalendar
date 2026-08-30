import { readFileSync } from "node:fs"

import { createFakeDb } from "@/test-support/fake-db"

// The coordinator's behavior, driven end to end: the REAL request module, the
// REAL generated v1 operation and the REAL repository, over the shared in-memory
// @/db harness. Only the two seams the app cannot run off-device are stubbed —
// the customFetch mutator (testing.md: mock at the mutator, never at `fetch`)
// and the calendar-sources read.
//
// Every test re-`require`s the module after `jest.resetModules()`, the idiom
// restart.test.ts already uses: the two in-flight slots are module-level state,
// so a fresh registry is what gives each test a clean pair. That also means the
// mocks are re-created per test and must be re-captured in `beforeEach` — in
// particular `ApiError`, whose identity must come from the SAME registry
// generation as the coordinator or `instanceof` would silently fail.
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
jest.mock("@/features/calendar-sources/data", () => ({ findAll: jest.fn() }))
jest.mock("@/api/mutator", () => ({
  ...jest.requireActual<object>("@/api/mutator"),
  customFetch: jest.fn(),
}))

type Coordinator = typeof import("./coordinator")
type Repository = typeof import("./repository")
type Mutator = typeof import("@/api/mutator")

let coordinator: Coordinator
let repository: Repository
let ApiError: Mutator["ApiError"]
let mockFetch: jest.Mock
let mockFindAll: jest.Mock
let mockRecord: jest.Mock

/* eslint-disable @typescript-eslint/no-require-imports */
function loadModules(): void {
  coordinator = require("./coordinator") as Coordinator
  repository = require("./repository") as Repository
  const mutator = require("@/api/mutator") as Mutator
  ApiError = mutator.ApiError
  mockFetch = mutator.customFetch as unknown as jest.Mock
  mockFindAll = (
    require("@/features/calendar-sources/data") as { findAll: jest.Mock }
  ).findAll
  mockRecord = (require("@/firebase") as { recordUnknownError: jest.Mock })
    .recordUnknownError
}
/* eslint-enable @typescript-eslint/no-require-imports */

const NOW = "2026-06-16T12:00:00.000Z"
const AS_OF = "2026-06-16T11:59:00.000Z"

const calendar = (
  id: string,
  token: string,
  visible = true,
): Record<string, unknown> => ({
  id,
  token,
  name: "L3 Informatique",
  schoolName: undefined,
  schoolId: undefined,
  lastUpdatedAt: new Date("2026-06-16T09:00:00.000Z"),
  createdAt: new Date("2026-06-10T08:00:00.000Z"),
  visible,
})

const item = (
  id: string,
  createdAt: string,
  calendarId = "cal-1",
): Record<string, unknown> => ({
  id,
  calendarId,
  calendarName: "L3 Informatique",
  calendarChange: { oldItems: [], newItems: [], changedItems: [] },
  createdAt,
  updatedAt: createdAt,
})

const pageResponse = (overrides: Record<string, unknown> = {}): unknown => ({
  items: [],
  nextCursor: null,
  asOf: AS_OF,
  ...overrides,
})

/** A promise the test resolves by hand — never a timer (design, Risks). */
function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

/** Let every pending microtask settle without advancing any clock. */
const flush = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve)
  })

const sentBodies = (): Record<string, unknown>[] =>
  mockFetch.mock.calls.map(
    (call) =>
      JSON.parse((call[1] as RequestInit).body as string) as Record<
        string,
        unknown
      >,
  )

const storedIds = async (): Promise<string[]> =>
  (await repository.listActivityLogs()).map((log) => log.id)

beforeEach(() => {
  jest.resetModules()
  mockFake.reset()
  // `mockFake.reset()` clears CALLS but not IMPLEMENTATIONS, so a fault injected
  // with `mockImplementation` would leak into every later test in the file and
  // fail it somewhere unrelated. These two are the fault-injection points used
  // below; resetting them makes each test independent of what ran before it.
  mockFake.spies.transaction.mockReset()
  mockFake.spies.select.mockReset()
  jest.useRealTimers()
  loadModules()
  mockFindAll.mockResolvedValue([calendar("cal-1", "tok-1")])
})

afterEach(() => {
  jest.useRealTimers()
})

// --- 5.1 single-flight (acceptance criterion) --------------------------------

describe("single-flight", () => {
  it("collapses overlapping forced and passive triggers into exactly one request", async () => {
    const inFlight = deferred<unknown>()
    mockFetch.mockReturnValueOnce(inFlight.promise)

    // Four triggers, mixed forced-ness, all while one request is in flight —
    // calendar sync, a push, the screen opening, a foreground.
    const triggers = [
      coordinator.refreshNewestPage(),
      coordinator.refreshNewestPage({ force: true }),
      coordinator.refreshNewestPage(),
      coordinator.refreshNewestPage({ force: true }),
    ]
    await flush()

    inFlight.resolve(pageResponse({ items: [item("log-a", AS_OF)] }))
    const outcomes = await Promise.all(triggers)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    // Every caller receives the outcome of the request that was actually issued.
    expect(outcomes).toEqual([
      { status: "updated" },
      { status: "updated" },
      { status: "updated" },
      { status: "updated" },
    ])
  })

  it("gives every joined caller the issuing request's failure classification", async () => {
    const inFlight = deferred<unknown>()
    mockFetch.mockReturnValueOnce(
      inFlight.promise.then(() => {
        throw new Error("offline")
      }),
    )

    const triggers = [
      coordinator.refreshNewestPage({ force: true }),
      coordinator.refreshNewestPage({ force: true }),
    ]
    await flush()
    inFlight.resolve(null)

    await expect(Promise.all(triggers)).resolves.toEqual([
      { status: "failed", reason: "network" },
      { status: "failed", reason: "network" },
    ])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("issues a new request once the previous one has settled", async () => {
    mockFetch.mockResolvedValue(pageResponse())

    await coordinator.refreshNewestPage({ force: true })
    await coordinator.refreshNewestPage({ force: true })

    // The slot self-clears in `finally`, so a later trigger is not stuck
    // joining a promise that already resolved.
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  // Architecture decision 7: the two slots are independent, so a backfill can
  // never block — or be blocked by — a forced newest-page refresh.
  it("does not let an in-flight older page block a forced newest-page refresh", async () => {
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: "cursor-2" }))
    await coordinator.refreshNewestPage({ force: true })
    mockFetch.mockReset()

    const olderInFlight = deferred<unknown>()
    mockFetch.mockReturnValueOnce(olderInFlight.promise)
    const older = coordinator.loadOlderPage()
    await flush()

    mockFetch.mockResolvedValueOnce(pageResponse())
    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "updated" })

    olderInFlight.resolve(pageResponse({ items: [], nextCursor: null }))
    await expect(older).resolves.toEqual({ status: "loaded" })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

// --- 5.2 freshness -----------------------------------------------------------

describe("five-minute freshness", () => {
  const seedSuccess = async (): Promise<void> => {
    mockFetch.mockResolvedValue(pageResponse())
    await coordinator.refreshNewestPage({ force: true })
    mockFetch.mockClear()
  }

  it("skips a passive trigger inside the window without issuing a request", async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    await seedSuccess()

    jest.setSystemTime(new Date("2026-06-16T12:04:59.000Z"))

    await expect(coordinator.refreshNewestPage()).resolves.toEqual({
      status: "fresh",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("issues exactly one request for a passive trigger outside the window", async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    await seedSuccess()

    jest.setSystemTime(new Date("2026-06-16T12:05:01.000Z"))
    mockFetch.mockResolvedValue(pageResponse())

    await expect(coordinator.refreshNewestPage()).resolves.toEqual({
      status: "updated",
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("issues a request for a forced trigger immediately after a success", async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    await seedSuccess()
    mockFetch.mockResolvedValue(pageResponse())

    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "updated" })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("refreshes when no successful refresh has ever happened", async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    mockFetch.mockResolvedValue(pageResponse())

    await expect(coordinator.refreshNewestPage()).resolves.toEqual({
      status: "updated",
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // The window is read from PERSISTED state, so a cold launch does not reopen
  // it. An in-memory timestamp would make a passive refresh fire on every start.
  it("keeps the window across a simulated restart", async () => {
    jest.useFakeTimers().setSystemTime(new Date(NOW))
    await seedSuccess()

    jest.resetModules()
    loadModules()
    jest.setSystemTime(new Date("2026-06-16T12:02:00.000Z"))

    await expect(coordinator.refreshNewestPage()).resolves.toEqual({
      status: "fresh",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("reports a failed freshness read as a storage fault, not a network one", async () => {
    mockFake.spies.select.mockImplementationOnce(() => {
      throw new Error("read boom")
    })

    await expect(coordinator.refreshNewestPage()).resolves.toEqual({
      status: "failed",
      reason: "storage",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

// --- 5.3 / 5.4 / 5.5 the D6 token precondition -------------------------------

describe("D6 — no request is issued outside 1…100 tokens", () => {
  it("issues no newest-page request on a device with no calendars", async () => {
    mockFindAll.mockResolvedValue([])

    await expect(coordinator.refreshNewestPage()).resolves.toEqual({
      status: "no-calendars",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // The badge wipe. `emptyPage` returns unreadCount: 0 without reaching
  // countUnread, and a passive refresh sends unreadSince — so D4's
  // request-branching rule would ACCEPT that 0 and clear the badge.
  it("preserves the unread count and cached rows when tokens are empty", async () => {
    mockFetch.mockResolvedValue(
      pageResponse({ items: [item("log-a", AS_OF)], unreadCount: 4 }),
    )
    await repository.markActivityRead("2026-06-16T08:00:00.000Z")
    await coordinator.refreshNewestPage({ force: true })
    const before = await repository.readActivityState()
    expect(before.unreadCount).toBe(4)

    mockFindAll.mockResolvedValue([])
    mockFetch.mockClear()
    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "no-calendars" })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(await storedIds()).toEqual(["log-a"])
    // The skip is NOT cached: lastSuccessfulRefreshAt did not move, so the next
    // trigger retries as soon as tokens exist instead of waiting five minutes.
    await expect(repository.readActivityState()).resolves.toEqual(before)
  })

  // The worse half of D6. A zero-token older page is a 200 with
  // nextCursor: null, which writes olderPageComplete: true — and NOTHING ever
  // clears it, so the student could never load older history again.
  it("issues no older-page request with no tokens, and leaves the chain open", async () => {
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: "cursor-2" }))
    await coordinator.refreshNewestPage({ force: true })
    mockFetch.mockClear()

    mockFindAll.mockResolvedValue([])
    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "no-calendars",
    })

    expect(mockFetch).not.toHaveBeenCalled()
    const state = await repository.readActivityState()
    // The regression assertion: without the guard this is `true`, permanently.
    expect(state.olderPageComplete).toBe(false)
    expect(state.olderPageCursor).toBe("cursor-2")
  })

  it.each([
    ["refreshNewestPage", () => coordinator.refreshNewestPage({ force: true })],
    ["loadOlderPage", () => coordinator.loadOlderPage()],
  ])(
    "%s issues nothing above the contract's 100-token ceiling",
    async (_label, run) => {
      mockFetch.mockResolvedValue(pageResponse({ nextCursor: "cursor-2" }))
      await coordinator.refreshNewestPage({ force: true })
      const before = await repository.readActivityState()
      mockFetch.mockClear()

      mockFindAll.mockResolvedValue(
        Array.from({ length: 101 }, (_, i) => calendar(`cal-${i}`, `tok-${i}`)),
      )

      await expect(run()).resolves.toEqual({ status: "too-many-calendars" })
      expect(mockFetch).not.toHaveBeenCalled()
      await expect(repository.readActivityState()).resolves.toEqual(before)
    },
  )
})

// --- 5.6 the unread count ----------------------------------------------------

describe("unread count (D4)", () => {
  it("sends the stored watermark and stores the server count without moving it", async () => {
    await repository.markActivityRead("2026-06-16T08:00:00.000Z")
    mockFetch.mockResolvedValue(
      pageResponse({ items: [item("log-a", AS_OF)], unreadCount: 3 }),
    )

    await coordinator.refreshNewestPage({ force: true })

    expect(sentBodies()[0]?.unreadSince).toBe("2026-06-16T08:00:00.000Z")
    const state = await repository.readActivityState()
    expect(state.unreadCount).toBe(3)
    // The spec's "a first-page refresh stores the server unread count without
    // moving the read watermark while the screen is closed".
    expect(state.lastReadAt?.toISOString()).toBe("2026-06-16T08:00:00.000Z")
  })

  it("sends no watermark when none is stored yet", async () => {
    mockFetch.mockResolvedValue(pageResponse())

    await coordinator.refreshNewestPage({ force: true })

    expect(sentBodies()[0]).not.toHaveProperty("unreadSince")
  })

  // The rule that D6 makes unreachable for the zero-token case but which is
  // load-bearing on its own: branch on the REQUEST, never on field presence.
  it("ignores an unreadCount the request never asked for", async () => {
    mockFetch.mockResolvedValue(pageResponse({ unreadCount: 0 }))

    await coordinator.refreshNewestPage({ force: true })

    // No watermark was stored, so no unreadSince was sent, so the response's
    // count is not ours to believe — the stored default stands.
    expect(sentBodies()[0]).not.toHaveProperty("unreadSince")
    expect((await repository.readActivityState()).unreadCount).toBe(0)
  })

  it("leaves the stored count alone on an older page", async () => {
    await repository.markActivityRead("2026-06-16T08:00:00.000Z")
    mockFetch.mockResolvedValue(
      pageResponse({ nextCursor: "cursor-2", unreadCount: 5 }),
    )
    await coordinator.refreshNewestPage({ force: true })
    expect((await repository.readActivityState()).unreadCount).toBe(5)

    mockFetch.mockClear()
    mockFetch.mockResolvedValue(pageResponse({ unreadCount: 0 }))
    await coordinator.loadOlderPage()

    // An older page never sends unreadSince, so its count is never written —
    // coalescing an absent count to 0 would clear the badge on every backfill.
    expect(sentBodies()[0]).not.toHaveProperty("unreadSince")
    expect((await repository.readActivityState()).unreadCount).toBe(5)
  })
})

// --- 5.7 pagination and cursor recovery --------------------------------------

describe("older-page pagination and cursor recovery (D3)", () => {
  const seedChain = async (): Promise<void> => {
    mockFetch.mockResolvedValue(
      pageResponse({ items: [item("log-a", AS_OF)], nextCursor: "cursor-2" }),
    )
    await coordinator.refreshNewestPage({ force: true })
    mockFetch.mockClear()
  }

  it("sends the stored cursor and advances the backfill position", async () => {
    await seedChain()
    mockFetch.mockResolvedValue(
      pageResponse({
        items: [item("log-old", "2026-06-01T09:00:00.000Z")],
        nextCursor: "cursor-3",
      }),
    )

    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "loaded",
    })

    expect(sentBodies()[0]?.cursor).toBe("cursor-2")
    expect(await storedIds()).toEqual(["log-a", "log-old"])
    expect((await repository.readActivityState()).olderPageCursor).toBe(
      "cursor-3",
    )
  })

  it("reports no stored cursor as unavailable without a request", async () => {
    // A fresh cache: no newest page has succeeded, so there is no position yet.
    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "unavailable",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // nextCursor: null is the FINAL-PAGE signal, not a dead chain. Suppressing it
  // would restart pagination forever at the end of history.
  it("treats a final page as complete, never as a reset", async () => {
    await seedChain()
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: null }))

    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "loaded",
    })

    const state = await repository.readActivityState()
    expect(state.olderPageComplete).toBe(true)
    expect(state.olderPageCursor).toBeNull()
  })

  it("issues no request once the chain is complete", async () => {
    await seedChain()
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: null }))
    await coordinator.loadOlderPage()
    mockFetch.mockClear()

    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "complete",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // The realistic production trigger is a cursor-version bump, which
  // invalidates every persisted cursor on every device at once.
  it("clears the cursor on a 400 and keeps every cached row", async () => {
    await seedChain()
    mockFetch.mockRejectedValue(
      new ApiError(400, { message: "Invalid cursor" }),
    )

    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "cursor-reset",
    })

    const state = await repository.readActivityState()
    expect(state.olderPageCursor).toBeNull()
    expect(state.olderPageComplete).toBe(false)
    // Deletes NO rows — the history stays readable offline.
    expect(await storedIds()).toEqual(["log-a"])
  })

  it.each([
    ["a 500", 500],
    ["a 404", 404],
  ])("does not treat %s as a dead cursor", async (_label, status) => {
    await seedChain()
    mockFetch.mockRejectedValue(new ApiError(status, {}))

    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "failed",
      reason: "server",
    })
    expect((await repository.readActivityState()).olderPageCursor).toBe(
      "cursor-2",
    )
  })

  it("reports a failed cursor reset as a storage fault", async () => {
    await seedChain()
    mockFetch.mockRejectedValue(new ApiError(400, {}))
    mockFake.spies.transaction.mockImplementationOnce(() => {
      throw new Error("transaction failed")
    })

    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "failed",
      reason: "storage",
    })
  })

  // A newest-page request carries no cursor, so a 400 there is a contract
  // violation, not cursor recovery — and it must not touch the chain.
  it("does not route a newest-page 400 into cursor recovery", async () => {
    await seedChain()
    mockFetch.mockRejectedValue(new ApiError(400, {}))

    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "failed", reason: "server" })

    const state = await repository.readActivityState()
    expect(state.olderPageCursor).toBe("cursor-2")
    expect(state.olderPageComplete).toBe(false)
    // Unlike an ordinary server fault, this one IS recorded as unexpected.
    expect(mockRecord).toHaveBeenCalledWith(
      expect.any(Error),
      "activity/refresh",
    )
  })

  it("collapses overlapping older-page triggers into one request", async () => {
    await seedChain()
    const inFlight = deferred<unknown>()
    mockFetch.mockReturnValueOnce(inFlight.promise)

    const triggers = [coordinator.loadOlderPage(), coordinator.loadOlderPage()]
    await flush()
    inFlight.resolve(pageResponse({ nextCursor: "cursor-3" }))

    await expect(Promise.all(triggers)).resolves.toEqual([
      { status: "loaded" },
      { status: "loaded" },
    ])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// --- 5.8 / 5.9 failure classification and preservation -----------------------

describe("failure classification (D10) and preservation", () => {
  const seedRows = async (): Promise<void> => {
    mockFetch.mockResolvedValue(
      pageResponse({ items: [item("log-a", AS_OF)], unreadCount: 2 }),
    )
    await repository.markActivityRead("2026-06-16T08:00:00.000Z")
    await coordinator.refreshNewestPage({ force: true })
    mockFetch.mockClear()
  }

  it("classifies a transport throw as network and preserves everything", async () => {
    await seedRows()
    const before = await repository.readActivityState()
    mockFetch.mockRejectedValue(new TypeError("Network request failed"))

    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "failed", reason: "network" })

    expect(await storedIds()).toEqual(["log-a"])
    await expect(repository.readActivityState()).resolves.toEqual(before)
  })

  it("classifies an ApiError as server and retains the cached rows", async () => {
    await seedRows()
    mockFetch.mockRejectedValue(new ApiError(503, { message: "unavailable" }))

    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "failed", reason: "server" })
    expect(await storedIds()).toEqual(["log-a"])
  })

  it("classifies an unparseable asOf as malformed and writes nothing", async () => {
    await seedRows()
    const before = await repository.readActivityState()
    mockFetch.mockResolvedValue(
      pageResponse({ asOf: "not a date", items: [item("log-b", AS_OF)] }),
    )

    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "failed", reason: "malformed" })

    // A page we could not read is not a success: no row, and the freshness
    // timestamp did not move.
    expect(await storedIds()).toEqual(["log-a"])
    await expect(repository.readActivityState()).resolves.toEqual(before)
  })

  it("classifies a throwing repository write as storage, not network", async () => {
    mockFetch.mockResolvedValue(pageResponse({ items: [item("log-a", AS_OF)] }))
    mockFake.spies.transaction.mockImplementationOnce(() => {
      throw new Error("transaction failed")
    })

    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toEqual({ status: "failed", reason: "storage" })
    expect(await storedIds()).toEqual([])
  })

  it("classifies a malformed older page and leaves the chain alone", async () => {
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: "cursor-2" }))
    await coordinator.refreshNewestPage({ force: true })
    mockFetch.mockResolvedValue(pageResponse({ items: "nope" }))

    await expect(coordinator.loadOlderPage()).resolves.toEqual({
      status: "failed",
      reason: "malformed",
    })
    expect((await repository.readActivityState()).olderPageCursor).toBe(
      "cursor-2",
    )
  })

  // The mechanism behind "a calendar-sync success is never converted into a
  // failure by an Activity refresh failure" (D11): there is no rejection for a
  // caller to forget to catch.
  it.each([
    [
      "a throwing fetch",
      (): void => {
        mockFetch.mockRejectedValue(new Error("boom"))
      },
    ],
    [
      "a throwing repository",
      (): void => {
        mockFetch.mockResolvedValue(pageResponse())
        mockFake.spies.transaction.mockImplementation(() => {
          throw new Error("transaction failed")
        })
      },
    ],
  ])("never rejects under %s", async (_label, arrange) => {
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: "cursor-2" }))
    await coordinator.refreshNewestPage({ force: true })
    arrange()

    await expect(
      coordinator.refreshNewestPage({ force: true }),
    ).resolves.toMatchObject({ status: "failed" })
    await expect(coordinator.loadOlderPage()).resolves.toMatchObject({
      status: "failed",
    })
  })
})

// --- 5.10 hidden calendars ---------------------------------------------------

describe("hidden calendars are held (D9)", () => {
  it("sends both tokens and keeps a hidden calendar's rows through the prune", async () => {
    mockFindAll.mockResolvedValue([
      calendar("cal-visible", "tok-visible", true),
      calendar("cal-hidden", "tok-hidden", false),
    ])
    mockFetch.mockResolvedValue(
      pageResponse({
        items: [
          item("log-visible", AS_OF, "cal-visible"),
          item("log-hidden", AS_OF, "cal-hidden"),
        ],
      }),
    )

    await coordinator.refreshNewestPage({ force: true })

    expect(sentBodies()[0]?.tokens).toEqual(["tok-visible", "tok-hidden"])
    // Had `visible` been a filter, the ownership prune would have deleted the
    // hidden calendar's entire history the first time the student hid it.
    expect((await storedIds()).sort()).toEqual(["log-hidden", "log-visible"])
  })
})

// --- 5.11 privacy ------------------------------------------------------------

describe("privacy — nothing identifying reaches Crashlytics", () => {
  const SECRET_TOKEN = "tok-secret-abcdef"
  const SECRET_CURSOR = "cursor-secret-payload"
  const SECRET_NAME = "M2 Cryptographie"
  const SECRET_LOCATION = "Salle B203 — Partiel de cryptographie"

  const forbidden = [
    SECRET_TOKEN,
    SECRET_CURSOR,
    SECRET_NAME,
    SECRET_LOCATION,
    "cal-secret-id",
    "log-secret-id",
    "2026-06-16T08:00:00.000Z",
  ]

  const expectClean = (): void => {
    for (const call of mockRecord.mock.calls) {
      const [error, context] = call as [Error, string]
      const recorded = `${error.message} ${error.stack ?? ""} ${context}`
      for (const secret of forbidden) {
        expect(recorded).not.toContain(secret)
      }
    }
  }

  beforeEach(() => {
    mockFindAll.mockResolvedValue([
      { ...calendar("cal-secret-id", SECRET_TOKEN), name: SECRET_NAME },
    ])
  })

  it("records a malformed page with a static context and no payload", async () => {
    await repository.markActivityRead("2026-06-16T08:00:00.000Z")
    mockFetch.mockResolvedValue(
      pageResponse({
        asOf: "not a date",
        items: [
          {
            ...item("log-secret-id", AS_OF, "cal-secret-id"),
            calendarName: SECRET_NAME,
            calendarChange: {
              oldItems: [{ location: SECRET_LOCATION }],
              newItems: [],
              changedItems: [],
            },
          },
        ],
      }),
    )

    await coordinator.refreshNewestPage({ force: true })

    expect(mockRecord).toHaveBeenCalledWith(
      expect.any(Error),
      "activity/refresh",
    )
    expectClean()
  })

  it("records a storage fault with a static context and no payload", async () => {
    mockFetch.mockResolvedValue(pageResponse())
    mockFake.spies.transaction.mockImplementationOnce(() => {
      throw new Error(`transaction failed for ${SECRET_TOKEN}`)
    })

    await coordinator.refreshNewestPage({ force: true })

    expect(mockRecord).toHaveBeenCalledWith(
      expect.any(Error),
      "activity/refresh",
    )
    expectClean()
  })

  it("records an older-page fault under its own static context", async () => {
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: SECRET_CURSOR }))
    await coordinator.refreshNewestPage({ force: true })
    mockRecord.mockClear()
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: 7 }))

    await coordinator.loadOlderPage()

    expect(mockRecord).toHaveBeenCalledWith(
      expect.any(Error),
      "activity/older-page",
    )
    expectClean()
  })

  // Expected conditions on a phone. Routing them to Crashlytics would bury real
  // faults under captive-portal noise.
  it.each([
    [
      "a network fault",
      (): void => void mockFetch.mockRejectedValue(new Error("offline")),
    ],
    [
      "an ordinary server fault",
      (): void => void mockFetch.mockRejectedValue(new ApiError(503, {})),
    ],
  ])("records nothing for %s", async (_label, arrange) => {
    arrange()

    await coordinator.refreshNewestPage({ force: true })

    expect(mockRecord).not.toHaveBeenCalled()
  })
})

// --- 5.12 no query cache -----------------------------------------------------

describe("no TanStack Query (D8)", () => {
  // An import-level fact is stronger than a configuration assertion: the module
  // cannot put an Activity key into the persisted school-selection cache if it
  // never touches a query client at all. It also pins the "plain generated
  // function, not the generated hook" half of D8.
  it.each(["coordinator.ts", "request.ts"])(
    "%s reaches for no query client and no generated hook",
    (file) => {
      const source = readFileSync(`${__dirname}/${file}`, "utf8")

      expect(source).not.toContain("@tanstack/react-query")
      expect(source).not.toContain("QueryClient")
      expect(source).not.toMatch(/\buseMutation\b|\buseQuery\b|\bfetchQuery\b/)
      expect(source).not.toContain("MutationOptions")
    },
  )
})

// --- 5.13 generated-contract wiring ------------------------------------------

describe("generated-contract wiring", () => {
  it("sends a SearchCalendarLogsV1Dto body to the v1 route", async () => {
    mockFindAll.mockResolvedValue([
      calendar("cal-1", "tok-a"),
      calendar("cal-2", "tok-a"),
      calendar("cal-3", "tok-b"),
    ])
    await repository.markActivityRead("2026-06-16T08:00:00.000Z")
    mockFetch.mockResolvedValue(pageResponse({ nextCursor: "cursor-2" }))

    await coordinator.refreshNewestPage({ force: true })
    await coordinator.loadOlderPage()

    const [newestCall, olderCall] = mockFetch.mock.calls as [
      [string, RequestInit],
      [string, RequestInit],
    ]
    expect(newestCall[0]).toBe("/v1/calendar-logs/search")
    expect(olderCall[0]).toBe("/v1/calendar-logs/search")

    const [newest, older] = sentBodies()
    // The frozen TIM-394 page budget, sent explicitly rather than defaulted.
    expect(newest).toEqual({
      limit: 50,
      tokens: ["tok-a", "tok-b"],
      unreadSince: "2026-06-16T08:00:00.000Z",
    })
    // `cursor` only on the older page; `unreadSince` only on the newest one.
    expect(older).toEqual({
      limit: 50,
      tokens: ["tok-a", "tok-b"],
      cursor: "cursor-2",
    })
  })
})
