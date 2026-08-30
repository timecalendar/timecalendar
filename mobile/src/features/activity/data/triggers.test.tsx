import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react-native"
import type { ReactNode } from "react"
import { AppState, type AppStateStatus } from "react-native"

import { customFetch } from "@/api/mutator"
import { findAll } from "@/features/calendar-sources/data"
import {
  getInitialTap,
  onForegroundMessage,
  onNotificationTap,
  type RemoteMessage,
} from "@/firebase"
import { createFakeDb } from "@/test-support/fake-db"

// THE ACCEPTANCE CRITERION for TIM-399, proven where it actually lives: at the
// WIRING. Every trigger runs for real — the real `useSyncCalendars`, the real
// `useNotificationTapRouting`, the real `useStartupSync` and the real lifecycle
// hooks — over ONE mocked customFetch, and the assertion is a count of
// `POST /v1/calendar-logs/search`.
//
// TIM-397's coordinator.test.ts already proves the slot logic in isolation; that
// is a different claim. What this file catches and that one cannot: a trigger
// that reaches for the generated client directly, a second QueryClient-backed
// path, or an `await` inserted between two of these calls that serialises them
// into two requests. The in-flight request is held open by a DEFERRED, never by
// a timer, so "overlapping" is a fact of the test rather than a race.
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
    calendarEvents: { columns: ["uid"], pk: "uid" },
  },
})

jest.mock("@/db", () => ({
  ...jest.requireActual<object>("@/db"),
  ...mockFake.module,
  ...jest.requireActual<object>("@/db/mappers"),
}))
jest.mock("@/firebase", () => ({
  recordUnknownError: jest.fn(),
  getInitialTap: jest.fn(),
  onForegroundMessage: jest.fn(),
  onNotificationTap: jest.fn(),
}))
jest.mock("expo-router", () => ({ useRouter: jest.fn() }))
jest.mock("@/features/calendar-sources/data", () => ({
  findAll: jest.fn(),
  useUserCalendars: jest.fn(() => []),
  useUserCalendarsLoaded: jest.fn(() => false),
}))
jest.mock("@/features/calendar-sources/data/user-calendars", () => ({
  findAll: jest.fn(),
  updateName: jest.fn(),
  upsert: jest.fn(),
}))
jest.mock("@/api/mutator", () => ({
  ...jest.requireActual<object>("@/api/mutator"),
  customFetch: jest.fn(),
}))

// Lazily required for the same reason as lifecycle.test.tsx: an eager `@/db`
// value import would fire the hoisted factory before `mockFake` is assigned.
/* eslint-disable @typescript-eslint/no-require-imports */
const { useStartupSync, useSyncCalendars } =
  require("@/features/calendar/data") as typeof import("@/features/calendar/data")
const { useNotificationTapRouting } =
  require("@/features/notifications/data/tap-routing") as typeof import("@/features/notifications/data/tap-routing")
const { useActivityForegroundRefresh, useActivityScreenRefresh } =
  require("./lifecycle") as typeof import("./lifecycle")
/* eslint-enable @typescript-eslint/no-require-imports */

const mockFetch = customFetch as jest.Mock
const mockActivityFindAll = findAll as jest.Mock
const mockSyncFindAll = (
  jest.requireMock("@/features/calendar-sources/data/user-calendars") as {
    findAll: jest.Mock
    updateName: jest.Mock
  }
).findAll
const mockOnForegroundMessage = onForegroundMessage as jest.Mock
const mockOnNotificationTap = onNotificationTap as jest.Mock
const mockGetInitialTap = getInitialTap as jest.Mock

const ACTIVITY_URL = "/v1/calendar-logs/search"
const SYNC_URL = "/calendars/sync"
const AS_OF = "2026-06-16T11:59:00.000Z"

const heldCalendar = {
  id: "cal-1",
  token: "tok_123",
  name: "L3 Informatique",
  schoolName: undefined,
  schoolId: undefined,
  lastUpdatedAt: new Date("2026-06-16T09:00:00.000Z"),
  createdAt: new Date("2026-06-10T08:00:00.000Z"),
  visible: true,
}

const syncResponse = [
  {
    calendar: { id: "cal-1", token: "tok_123", name: "L3 Informatique" },
    events: [],
  },
]

const activityResponse = { items: [], nextCursor: null, asOf: AS_OF }

// The coordinator's in-flight slot is MODULE-LEVEL state shared by every test in
// this file, and these are the only tests that deliberately leave a request
// unresolved. Every deferred is registered here and drained in afterEach, so a
// failing assertion cannot strand the slot and turn one real failure into three
// misleading "0 requests" cascades in the tests after it.
const pendingDeferreds: ((value: unknown) => void)[] = []

/** A promise the test resolves by hand — never a timer. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  pendingDeferreds.push(resolve as (value: unknown) => void)
  return { promise, resolve }
}

const flush = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => setImmediate(resolve))
  })
}

const requestsTo = (url: string): unknown[] =>
  mockFetch.mock.calls.filter((call) => call[0] === url)

function digestMessage(): RemoteMessage {
  return { data: { action: "calendar_digest" } } as unknown as RemoteMessage
}

let appStateListeners: ((state: AppStateStatus) => void)[] = []
/** Whatever `/v1/calendar-logs/search` should answer with, per test. */
let activityResponder: () => Promise<unknown>
/** Whatever `/calendars/sync` should answer with, per test. */
let syncResponder: () => Promise<unknown>

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFake.reset()

  appStateListeners = []
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      appStateListeners.push(listener as (state: AppStateStatus) => void)
      return { remove: jest.fn() } as never
    })

  activityResponder = () => Promise.resolve(activityResponse)
  syncResponder = () => Promise.resolve(syncResponse)
  mockFetch.mockImplementation((url: string) => {
    if (url === ACTIVITY_URL) return activityResponder()
    if (url === SYNC_URL) return syncResponder()
    throw new Error(`unexpected request to ${url}`)
  })

  mockActivityFindAll.mockResolvedValue([heldCalendar])
  mockSyncFindAll.mockResolvedValue([heldCalendar])
  mockOnForegroundMessage.mockReturnValue(jest.fn())
  mockOnNotificationTap.mockReturnValue(jest.fn())
  mockGetInitialTap.mockResolvedValue(null)
  pendingDeferreds.length = 0
})

afterEach(async () => {
  for (const resolve of pendingDeferreds) resolve(activityResponse)
  pendingDeferreds.length = 0
  await new Promise((resolve) => setImmediate(resolve))
})

describe("overlapping Activity triggers", () => {
  function useAllTriggers() {
    useNotificationTapRouting()
    useActivityForegroundRefresh()
    useActivityScreenRefresh()
    return useSyncCalendars()
  }

  it("collapses a push, a sync completion, a screen open and a foreground return into ONE request", async () => {
    // The screen-open refresh at mount opens the request and the deferred holds
    // it open; every later trigger arrives while it is still in flight.
    const inFlight = deferred<unknown>()
    activityResponder = () => inFlight.promise

    const { result } = await renderHook(() => useAllTriggers(), { wrapper })
    await flush()
    expect(requestsTo(ACTIVITY_URL)).toHaveLength(1)

    await act(async () => {
      // 1. A relevant push, in the foreground.
      const handler = mockOnForegroundMessage.mock.calls[0]![0] as (
        m: RemoteMessage,
      ) => void
      handler(digestMessage())
      // 2. A calendar sync that runs to a successful event write. (The push
      //    above independently starts one of its own — see D4.)
      void result.current.sync()
      // 3. A foreground return.
      for (const listener of appStateListeners) listener("background")
      for (const listener of appStateListeners) listener("active")
      await new Promise((resolve) => setImmediate(resolve))
    })

    // TWO calendar syncs really did complete — the push's own `void sync()` and
    // the explicit one — otherwise their Activity triggers would be absent for an
    // uninteresting reason and this test would pass vacuously. Two successful
    // syncs means two forced refreshes, which is MORE overlap, not less.
    expect(requestsTo(SYNC_URL)).toHaveLength(2)
    expect(result.current.isError).toBe(false)
    // FOUR triggers, ONE request.
    expect(requestsTo(ACTIVITY_URL)).toHaveLength(1)

    await act(async () => {
      inFlight.resolve(activityResponse)
      await new Promise((resolve) => setImmediate(resolve))
    })
    expect(requestsTo(ACTIVITY_URL)).toHaveLength(1)
  })

  it("releases the slot: a trigger after the request settled issues a new one", async () => {
    // The complement of the test above — proving the collapse is single-FLIGHT
    // and not a one-shot latch that would leave Activity permanently stale.
    const { result } = await renderHook(() => useAllTriggers(), { wrapper })
    await flush()
    expect(requestsTo(ACTIVITY_URL)).toHaveLength(1)

    await act(async () => {
      void result.current.sync()
      await new Promise((resolve) => setImmediate(resolve))
    })

    expect(requestsTo(ACTIVITY_URL)).toHaveLength(2)
  })
})

describe("cold launch", () => {
  // D8: cold launch adds no code — the startup sync's post-storage refresh IS
  // the cold-launch trigger, so the claim is discharged by asserting it.
  function useColdLaunch(): void {
    useStartupSync()
  }

  it("issues exactly one Activity request through the startup sync", async () => {
    await renderHook(() => useColdLaunch(), { wrapper })
    await flush()
    await flush()

    expect(requestsTo(SYNC_URL)).toHaveLength(1)
    // Exactly one, from exactly one startup path — no second unconditional
    // launch refresh was added beside it.
    expect(requestsTo(ACTIVITY_URL)).toHaveLength(1)
  })

  it("issues ZERO Activity requests on an offline cold launch", async () => {
    // Documented behavior, not a bug (D8): the trigger table gives cold launch
    // no independent row, so a failed startup sync means Activity becomes
    // current at the next screen open, foreground return, push or sync. An
    // unconditional launch refresh would spend a request on every launch for
    // every student — the capacity posture this epic exists to avoid.
    syncResponder = () => Promise.reject(new Error("offline"))

    await renderHook(() => useColdLaunch(), { wrapper })
    await flush()
    await flush()

    expect(requestsTo(SYNC_URL)).toHaveLength(1)
    expect(requestsTo(ACTIVITY_URL)).toHaveLength(0)
  })
})
