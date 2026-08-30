import { act, renderHook } from "@testing-library/react-native"
import { AppState, type AppStateStatus } from "react-native"

import { customFetch } from "@/api/mutator"
import {
  findAll,
  useUserCalendars,
  useUserCalendarsLoaded,
} from "@/features/calendar-sources/data"
import { recordUnknownError } from "@/firebase"
import { createFakeDb } from "@/test-support/fake-db"

// The three Activity-owned triggers, driven over the REAL coordinator, the REAL
// request layer and the REAL repository — only the two seams the app cannot run
// off-device are stubbed: the customFetch mutator (testing.md: mock at the
// mutator, never at `fetch`) and the calendar-sources read.
//
// That is deliberate rather than convenient. "Refresh when the last success is
// older than five minutes" is a claim about the PERSISTED timestamp, so it is
// only worth asserting against the real repository read; a mocked
// `refreshNewestPage` would let the window pass by construction. Every count
// below is therefore a count of REQUESTS AT THE MUTATOR, which is the thing the
// epic's capacity budget is denominated in.
//
// The clock is faked, and ONLY the clock: `Date` is the single API the
// coordinator's freshness arithmetic reads, and leaving the timer APIs real
// keeps React's scheduler and the promise flushes below working normally.
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
jest.mock("@/features/calendar-sources/data", () => ({
  findAll: jest.fn(),
  useUserCalendars: jest.fn(),
  useUserCalendarsLoaded: jest.fn(),
}))
jest.mock("@/api/mutator", () => ({
  ...jest.requireActual<object>("@/api/mutator"),
  customFetch: jest.fn(),
}))

// require() the SUT lazily (not a top-level import), the idiom repository.test.ts
// documents: its eager `@/db` value import would otherwise fire the hoisted
// jest.mock factory above before `mockFake` is assigned. The modules are required
// ONCE and never re-required — the coordinator's in-flight slots are module-level
// state, and a fresh registry would also hand these hooks a different React than
// the test renderer's.
/* eslint-disable @typescript-eslint/no-require-imports */
const {
  useActivityForegroundRefresh,
  useActivityOwnershipPrune,
  useActivityScreenRefresh,
} = require("./lifecycle") as typeof import("./lifecycle")
const repository = require("./repository") as typeof import("./repository")
/* eslint-enable @typescript-eslint/no-require-imports */

const mockFetch = customFetch as jest.Mock
const mockFindAll = findAll as jest.Mock
const mockUseUserCalendars = useUserCalendars as jest.Mock
const mockUseUserCalendarsLoaded = useUserCalendarsLoaded as jest.Mock
const mockRecord = recordUnknownError as jest.Mock
const mockPrune = jest.spyOn(repository, "pruneToHeldCalendars")

const NOW = "2026-06-16T12:00:00.000Z"
const AS_OF = "2026-06-16T11:59:00.000Z"
const MINUTE = 60 * 1000

const CALENDAR_TOKEN = "tok_secret_123"
const CALENDAR_NAME = "L3 Informatique"

const calendar = (id: string, visible = true): Record<string, unknown> => ({
  id,
  token: `${CALENDAR_TOKEN}-${id}`,
  name: CALENDAR_NAME,
  schoolName: undefined,
  schoolId: undefined,
  lastUpdatedAt: new Date("2026-06-16T09:00:00.000Z"),
  createdAt: new Date("2026-06-10T08:00:00.000Z"),
  visible,
})

/** A promise the test resolves by hand — never a timer. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

/** Let every pending microtask settle. `setImmediate` is deliberately real. */
const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve))
  })
}

/**
 * Seed the persisted freshness timestamp the passive window is measured against,
 * through the real repository write that owns it — not by poking the fake's
 * store, so the seed and the production write cannot drift apart.
 */
async function seedLastSuccess(minutesAgo: number): Promise<void> {
  await repository.storeNewestPage({
    rows: [],
    asOf: AS_OF,
    heldCalendarIds: ["cal-1"],
    nextCursor: null,
    lastSuccessfulRefreshAt: new Date(Date.parse(NOW) - minutesAgo * MINUTE),
  })
  mockFetch.mockClear()
}

/**
 * 6.11 — nothing identifying may reach a crash report. Asserted over every
 * argument of every recorded call, serialized, so a payload added later as a
 * second argument or a nested field fails here.
 */
function expectNoPersonalDataRecorded(): void {
  const serialized = JSON.stringify(
    mockRecord.mock.calls.map((call) =>
      call.map((argument: unknown) =>
        argument instanceof Error ? argument.message : argument,
      ),
    ),
  )
  for (const secret of [CALENDAR_TOKEN, CALENDAR_NAME, "cal-1", "cal-2"]) {
    expect(serialized).not.toContain(secret)
  }
}

/**
 * Mount the foreground hook and let its subscribe effect run. The flush is
 * load-bearing: without it the first emitted state finds no listener yet, and
 * `background → active` silently degrades to a bare `active`.
 */
async function mountForeground(): Promise<{ unmount: () => void }> {
  const rendered = await renderHook(() => useActivityForegroundRefresh())
  await flush()
  return rendered
}

let appStateListeners: ((state: AppStateStatus) => void)[] = []
const removeAppStateSubscription = jest.fn()

async function emitAppState(state: AppStateStatus): Promise<void> {
  await act(async () => {
    for (const listener of appStateListeners) listener(state)
    await new Promise((resolve) => setImmediate(resolve))
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFake.reset()
  // Only `Date` is faked. Every timer API stays real so React's scheduler and
  // the microtask flushes above behave exactly as they do in the other suites.
  jest.useFakeTimers({
    doNotFake: [
      "cancelAnimationFrame",
      "cancelIdleCallback",
      "clearImmediate",
      "clearInterval",
      "clearTimeout",
      "hrtime",
      "nextTick",
      "performance",
      "queueMicrotask",
      "requestAnimationFrame",
      "requestIdleCallback",
      "setImmediate",
      "setInterval",
      "setTimeout",
    ],
  })
  jest.setSystemTime(new Date(NOW))

  appStateListeners = []
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      appStateListeners.push(listener as (state: AppStateStatus) => void)
      return { remove: removeAppStateSubscription } as never
    })

  mockFindAll.mockResolvedValue([calendar("cal-1")])
  mockUseUserCalendars.mockReturnValue([])
  mockUseUserCalendarsLoaded.mockReturnValue(false)
  mockPrune.mockImplementation(async () => undefined)
  mockFetch.mockResolvedValue({ items: [], nextCursor: null, asOf: AS_OF })
})

afterEach(() => {
  jest.useRealTimers()
})

describe("useActivityForegroundRefresh", () => {
  it("refreshes once on a background → active return", async () => {
    await mountForeground()

    await emitAppState("background")
    await emitAppState("active")

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls[0]?.[0]).toBe("/v1/calendar-logs/search")
  })

  it("refreshes nothing on inactive → active with no preceding background", async () => {
    // The iOS notification-shade pull, control-centre swipe and incoming call.
    // Spending a request on each is the capacity posture this epic exists to
    // avoid.
    await mountForeground()

    await emitAppState("inactive")
    await emitAppState("active")

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("refreshes nothing on a second active without a new background", async () => {
    await mountForeground()

    await emitAppState("background")
    await emitAppState("active")
    await emitAppState("active")

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("removes the AppState listener on unmount", async () => {
    const { unmount } = await mountForeground()
    await act(async () => {
      unmount()
    })

    expect(removeAppStateSubscription).toHaveBeenCalledTimes(1)
  })
})

describe("the five-minute passive window", () => {
  // The window itself is the coordinator's (TIM-397); what is asserted here is
  // that BOTH passive triggers go through it and that the forced one does not.
  it("issues nothing on a foreground return four minutes after the last success", async () => {
    await seedLastSuccess(4)
    await mountForeground()

    await emitAppState("background")
    await emitAppState("active")

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("issues nothing on a screen open four minutes after the last success, and reports fresh", async () => {
    await seedLastSuccess(4)
    const { result } = await renderHook(() => useActivityScreenRefresh())
    await flush()

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.outcome).toEqual({ status: "fresh" })
  })

  it("issues one request on a foreground return six minutes after the last success", async () => {
    await seedLastSuccess(6)
    await mountForeground()

    await emitAppState("background")
    await emitAppState("active")

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("issues one request on a screen open six minutes after the last success", async () => {
    await seedLastSuccess(6)
    const { result } = await renderHook(() => useActivityScreenRefresh())
    await flush()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.current.outcome).toEqual({ status: "updated" })
  })

  it("issues one request for a FORCED refresh inside the window", async () => {
    // Pull-to-refresh is the student asking; freshness must not silently
    // swallow it.
    await seedLastSuccess(4)
    const { result } = await renderHook(() => useActivityScreenRefresh())
    await flush()
    expect(mockFetch).not.toHaveBeenCalled()

    await act(async () => {
      result.current.refresh()
      await new Promise((resolve) => setImmediate(resolve))
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.current.outcome).toEqual({ status: "updated" })
  })
})

describe("useActivityScreenRefresh", () => {
  it("fires the mount refresh exactly once across re-renders", async () => {
    const { rerender } = await renderHook(() => useActivityScreenRefresh())
    await flush()
    await act(async () => {
      rerender(undefined)
      rerender(undefined)
    })
    await flush()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("reports null then the coordinator's outcome, with isRefreshing in between", async () => {
    const pending = deferred<unknown>()
    mockFetch.mockReturnValue(pending.promise)

    const { result } = await renderHook(() => useActivityScreenRefresh())
    await flush()

    expect(result.current.outcome).toBeNull()
    expect(result.current.isRefreshing).toBe(true)

    await act(async () => {
      pending.resolve({ items: [], nextCursor: null, asOf: AS_OF })
      await new Promise((resolve) => setImmediate(resolve))
    })

    expect(result.current.outcome).toEqual({ status: "updated" })
    expect(result.current.isRefreshing).toBe(false)
  })

  it("exposes a failure outcome verbatim rather than throwing it", async () => {
    // The screen keeps cached content visible underneath and shows the failure;
    // the hook deletes nothing and interprets nothing.
    mockFetch.mockRejectedValue(new Error("offline"))

    const { result } = await renderHook(() => useActivityScreenRefresh())
    await flush()

    expect(result.current.outcome).toEqual({
      status: "failed",
      reason: "network",
    })
    expect(result.current.isRefreshing).toBe(false)
    // A network fault on a phone is an expected condition, never a crash report.
    expect(mockRecord).not.toHaveBeenCalled()
  })

  it("writes no state when the refresh settles after unmount", async () => {
    const pending = deferred<unknown>()
    mockFetch.mockReturnValue(pending.promise)
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
      /* captured, not printed */
    })

    const { unmount } = await renderHook(() => useActivityScreenRefresh())
    await flush()
    await act(async () => {
      unmount()
    })

    await act(async () => {
      pending.resolve({ items: [], nextCursor: null, asOf: AS_OF })
      await new Promise((resolve) => setImmediate(resolve))
    })

    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe("useActivityOwnershipPrune", () => {
  async function mountPrune(
    calendars: Record<string, unknown>[],
    loaded: boolean,
  ) {
    mockUseUserCalendars.mockReturnValue(calendars)
    mockUseUserCalendarsLoaded.mockReturnValue(loaded)
    const rendered = await renderHook(() => useActivityOwnershipPrune())
    await flush()
    return rendered
  }

  async function observe(
    rerender: (props: undefined) => void,
    calendars: Record<string, unknown>[],
    loaded = true,
  ): Promise<void> {
    // A fresh array identity, as the live query produces on every table change.
    mockUseUserCalendars.mockReturnValue(calendars)
    mockUseUserCalendarsLoaded.mockReturnValue(loaded)
    await act(async () => {
      rerender(undefined)
      await new Promise((resolve) => setImmediate(resolve))
    })
  }

  it("prunes nothing while the live query has not loaded", async () => {
    const { rerender } = await mountPrune(
      [calendar("cal-1"), calendar("cal-2")],
      false,
    )
    await observe(rerender, [calendar("cal-1")], false)

    expect(mockPrune).not.toHaveBeenCalled()
  })

  it("prunes nothing on the FIRST loaded observation, even when it is empty", async () => {
    // THE cache-destroying case. An unsettled read and a device that genuinely
    // holds nothing are indistinguishable, so the first observation is a
    // baseline and never a removal event.
    await mountPrune([], true)

    expect(mockPrune).not.toHaveBeenCalled()
  })

  it("prunes nothing on a first loaded observation that holds calendars", async () => {
    await mountPrune([calendar("cal-1"), calendar("cal-2")], true)

    expect(mockPrune).not.toHaveBeenCalled()
  })

  it("prunes to the remaining id when one calendar is removed", async () => {
    const { rerender } = await mountPrune(
      [calendar("cal-1"), calendar("cal-2")],
      true,
    )
    await observe(rerender, [calendar("cal-1")])

    expect(mockPrune).toHaveBeenCalledTimes(1)
    expect(mockPrune).toHaveBeenCalledWith(["cal-1"])
  })

  it("prunes to the empty set when every calendar is removed", async () => {
    const { rerender } = await mountPrune(
      [calendar("cal-1"), calendar("cal-2")],
      true,
    )
    await observe(rerender, [])

    expect(mockPrune).toHaveBeenCalledTimes(1)
    expect(mockPrune).toHaveBeenCalledWith([])
  })

  it("prunes nothing when a calendar is merely hidden", async () => {
    // A hidden calendar is still HELD. Treating `visible: false` as a removal
    // would delete that calendar's whole history the first time a student hid
    // it.
    const { rerender } = await mountPrune(
      [calendar("cal-1"), calendar("cal-2")],
      true,
    )
    await observe(rerender, [calendar("cal-1"), calendar("cal-2", false)])

    expect(mockPrune).not.toHaveBeenCalled()
  })

  it("prunes nothing when a calendar is added", async () => {
    const { rerender } = await mountPrune([calendar("cal-1")], true)
    await observe(rerender, [calendar("cal-1"), calendar("cal-2")])

    expect(mockPrune).not.toHaveBeenCalled()
  })

  it("prunes to the full current set on a simultaneous add and remove", async () => {
    const { rerender } = await mountPrune([calendar("cal-1")], true)
    await observe(rerender, [calendar("cal-2")])

    expect(mockPrune).toHaveBeenCalledTimes(1)
    // The argument is what the device HOLDS NOW, not what left — the operation
    // is "prune to held", so the newly added id must be in it or its history
    // would be deleted the moment it arrived.
    expect(mockPrune).toHaveBeenCalledWith(["cal-2"])
  })

  it("records a prune failure under activity/prune without throwing out of the effect", async () => {
    mockPrune.mockRejectedValue(new Error("sqlite boom"))
    const { rerender } = await mountPrune(
      [calendar("cal-1"), calendar("cal-2")],
      true,
    )
    await observe(rerender, [calendar("cal-1")])

    expect(mockRecord).toHaveBeenCalledTimes(1)
    expect(mockRecord.mock.calls[0]?.[1]).toBe("activity/prune")
    expectNoPersonalDataRecorded()
  })

  it("re-arms after a failed prune: a later removal prunes again", async () => {
    // The ref advances on every loaded observation, so a failure is not sticky —
    // the next removal is still seen as a transition.
    mockPrune.mockRejectedValueOnce(new Error("sqlite boom"))
    const { rerender } = await mountPrune(
      [calendar("cal-1"), calendar("cal-2"), calendar("cal-3")],
      true,
    )
    await observe(rerender, [calendar("cal-1"), calendar("cal-2")])
    await observe(rerender, [calendar("cal-1")])

    expect(mockPrune).toHaveBeenCalledTimes(2)
    expect(mockPrune).toHaveBeenLastCalledWith(["cal-1"])
  })
})
