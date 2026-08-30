import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"
import { refreshNewestPage } from "@/features/activity"
import {
  findAll as findAllUserCalendars,
  updateName as updateUserCalendarName,
  upsert as upsertUserCalendar,
} from "@/features/calendar-sources/data/user-calendars"
import { recordUnknownError } from "@/firebase"

import * as repository from "./repository"
import { useSyncCalendars } from "./sync"

// The sync-wiring proof: mocks at the customFetch mutator seam (the designed seam,
// never the network) and drives the REAL generated sync mutation through a real
// QueryClient. Asserts the success chain (read tokens → POST /calendars/sync →
// flatten DTOs to VERBATIM rows → replaceAll(rows)), the no-tokens no-op, and the
// OBSERVABILITY SPLIT (D6): a fetch failure → isError, NO recordError; a replaceAll
// throw → recordError + isError. The flattened payload handed to replaceAll is
// verbatim insert ROWS now (dtoToRow's output), not domain events.
jest.mock("@/api/mutator")
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
// `upsert` is mocked purely so the tests can PROVE it is never reached on this
// path: a full-row write would carry fromCalendarForPublic's hard-coded
// `visible: true` and unhide a hidden calendar on every sync (design D1).
jest.mock("@/features/calendar-sources/data/user-calendars", () => ({
  findAll: jest.fn(),
  updateName: jest.fn(),
  upsert: jest.fn(),
}))
// The Activity trigger (TIM-399 / ADR 049 D3) is mocked at the FEATURE BARREL —
// the seam sync.ts actually imports — so these tests assert the edge (fired,
// forced, once, at the right point in the chain) without re-proving the
// coordinator's own policy, which coordinator.test.ts owns. The wiring is proven
// unmocked, end to end, in activity/data/triggers.test.tsx.
jest.mock("@/features/activity", () => ({ refreshNewestPage: jest.fn() }))
jest.spyOn(repository, "replaceAll").mockResolvedValue(undefined)

const mockFetch = customFetch as jest.Mock
const mockFindAll = findAllUserCalendars as jest.Mock
const mockUpdateName = updateUserCalendarName as jest.Mock
const mockUpsert = upsertUserCalendar as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockReplaceAll = repository.replaceAll as jest.Mock
const mockRefreshActivity = refreshNewestPage as jest.Mock

/** A promise the test resolves by hand — never a timer. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const calendarToken = {
  id: "cal-1",
  token: "tok_123",
  name: "ENSEEIHT",
  schoolName: undefined,
  schoolId: undefined,
  lastUpdatedAt: new Date(),
  createdAt: new Date(),
  visible: true,
}

const dtoEvent = {
  type: "cm",
  color: "#1E88E5",
  groupColor: "#0D47A1",
  uid: "ev-1",
  title: "Algorithms",
  startsAt: "2026-06-16T09:00:00.000Z",
  endsAt: "2026-06-16T10:30:00.000Z",
  location: "Room A1",
  allDay: false,
  description: null,
  teachers: ["Dr. Ada"],
  tags: [{ name: "CM", color: "#FF0000", icon: "book" }],
  fields: { canceled: false },
  exportedAt: "2026-06-15T08:00:00.000Z",
}

const syncResponse = [
  {
    calendar: { id: "cal-1", token: "tok_123", name: "ENSEEIHT" },
    events: [dtoEvent],
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockReplaceAll.mockResolvedValue(undefined)
  mockFindAll.mockResolvedValue([calendarToken])
  mockUpdateName.mockResolvedValue(undefined)
  mockRefreshActivity.mockResolvedValue({ status: "updated" })
})

afterEach(() => {
  mockFetch.mockReset()
  mockReplaceAll.mockReset()
})

describe("useSyncCalendars", () => {
  it("reads tokens, batch-syncs, and replaces with the flattened+mapped events", async () => {
    mockFetch.mockResolvedValueOnce(syncResponse)

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    // POST /calendars/sync with the held tokens (batch, one call).
    expect(mockFetch.mock.calls[0]?.[0]).toBe("/calendars/sync")
    expect(mockFetch.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({ tokens: ["tok_123"] }),
    )
    // The flattened VERBATIM rows are replaced, carrying the parent calendar id +
    // the full DTO fidelity (groupColor, type enum, rich tag JSON) — no data loss.
    expect(mockReplaceAll).toHaveBeenCalledTimes(1)
    const replaced = mockReplaceAll.mock.calls[0]?.[0]
    expect(replaced).toHaveLength(1)
    expect(replaced[0].uid).toBe("ev-1")
    expect(replaced[0].userCalendarId).toBe("cal-1")
    expect(replaced[0].groupColor).toBe("#0D47A1")
    expect(replaced[0].type).toBe("cm")
    expect(JSON.parse(replaced[0].tags)).toEqual([
      { name: "CM", color: "#FF0000", icon: "book" },
    ])
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("is a no-op (no request) when there are no tokens", async () => {
    mockFindAll.mockResolvedValue([])

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockReplaceAll).not.toHaveBeenCalled()
    expect(result.current.isError).toBe(false)
  })

  it("flips isError without recordError when the fetch fails (recoverable)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockReplaceAll).not.toHaveBeenCalled()
    // A fetch failure is recoverable — the last-good rows render; NOT recorded.
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
  })

  it("records a replaceAll transaction failure (crash-worthy local write)", async () => {
    mockFetch.mockResolvedValueOnce(syncResponse)
    mockReplaceAll.mockRejectedValueOnce(new Error("sqlite boom"))

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError.mock.calls[0]?.[1]).toBe("calendar/sync")
  })

  it("records a dtoToRow mapping failure (a malformed DTO is crash-worthy, not a silent fetch error)", async () => {
    // A malformed date the verbatim mapper can't shape: new Date("nope")
    // .toISOString() throws RangeError. The mapping runs in the local-write
    // failure domain (not before it), so the throw is recordError'd — NOT
    // mis-bucketed as a recoverable fetch failure (the observability split, D6).
    mockFetch.mockResolvedValueOnce([
      {
        calendar: { id: "cal-1", token: "tok_123", name: "ENSEEIHT" },
        events: [{ ...dtoEvent, startsAt: "not-a-real-date" }],
      },
    ])

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockReplaceAll).not.toHaveBeenCalled()
    expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError.mock.calls[0]?.[1]).toBe("calendar/sync")
  })

  it("reset clears the error state", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    await act(() => {
      result.current.reset()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))

    mockFetch.mockRejectedValueOnce(new Error("must not leak"))
    mockReplaceAll.mockRejectedValueOnce(new Error("must not leak"))
  })

  describe("name convergence", () => {
    const renamed = [
      {
        calendar: { id: "cal-1", token: "tok_123", name: "L3 Informatique" },
        events: [dtoEvent],
      },
    ]

    it("writes the server name through the narrow updateName when it changed", async () => {
      mockFetch.mockResolvedValueOnce(renamed)

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      expect(mockUpdateName).toHaveBeenCalledWith("cal-1", "L3 Informatique")
      expect(result.current.isError).toBe(false)
    })

    it("issues no write when every returned name already matches", async () => {
      // syncResponse carries the same "ENSEEIHT" the local snapshot holds.
      mockFetch.mockResolvedValueOnce(syncResponse)

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      expect(mockUpdateName).not.toHaveBeenCalled()
    })

    // The correctness crux (design D1): a hidden calendar must converge on the
    // server name and STAY hidden. `visible` is a client-only field absent from
    // the DTO, so any full-row write would resurrect it on every sync.
    it("converges a hidden calendar's name without ever upserting a full row", async () => {
      mockFindAll.mockResolvedValue([{ ...calendarToken, visible: false }])
      mockFetch.mockResolvedValueOnce(renamed)

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      expect(mockUpdateName).toHaveBeenCalledWith("cal-1", "L3 Informatique")
      // The only write reaching user_calendars is the one-column UPDATE: no
      // upsert anywhere on the sync path, so `visible: false` survives.
      expect(mockUpsert).not.toHaveBeenCalled()
      expect(mockUpdateName.mock.calls[0]).toHaveLength(2)
    })

    it("keeps the replaced events and the last-good name when the name write fails", async () => {
      mockFetch.mockResolvedValueOnce(renamed)
      mockUpdateName.mockRejectedValueOnce(new Error("sqlite boom"))

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      // The events the user came for stayed committed — the replace ran and was
      // not rolled back (two failure domains, design D3).
      expect(mockReplaceAll).toHaveBeenCalledTimes(1)
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
      // A context distinct from the replace's, so a permanently failing metadata
      // write is not mis-attributed to the event transaction.
      expect(mockRecordUnknownError.mock.calls[0]?.[1]).toBe(
        "calendar/sync-names",
      )
    })
  })

  // TIM-399 / ADR 049 D3. Two separate claims live here: the trigger fires on
  // exactly the success path and nowhere else, and an Activity failure cannot
  // reach the sync's result. The second is the epic's acceptance criterion.
  describe("Activity refresh trigger", () => {
    it("fires exactly one FORCED refresh, after the event write committed", async () => {
      mockFetch.mockResolvedValueOnce(syncResponse)

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
      // Forced: a completed sync IS new activity, so the coordinator's
      // five-minute passive window must not suppress it.
      expect(mockRefreshActivity).toHaveBeenCalledWith({ force: true })
      // Ordering is the decision, not an incidental: "after event storage
      // succeeds". Asserted on the real call order rather than by reading the
      // source, so moving the line into the try block fails here.
      expect(mockRefreshActivity.mock.invocationCallOrder[0]).toBeGreaterThan(
        mockReplaceAll.mock.invocationCallOrder[0]!,
      )
    })

    it("fires nothing when replaceAll throws (the events were not stored)", async () => {
      mockFetch.mockResolvedValueOnce(syncResponse)
      mockReplaceAll.mockRejectedValueOnce(new Error("sqlite boom"))

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(mockRefreshActivity).not.toHaveBeenCalled()
    })

    it("fires nothing when the device holds no calendars (no request at all)", async () => {
      mockFindAll.mockResolvedValue([])

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockRefreshActivity).not.toHaveBeenCalled()
    })

    it("still fires when the LATER name convergence throws", async () => {
      // The two are separate failure domains and the Activity trigger sits
      // between them. Hanging it behind name convergence would silently suppress
      // Activity whenever a metadata write failed.
      mockFetch.mockResolvedValueOnce([
        {
          calendar: { id: "cal-1", token: "tok_123", name: "L3 Informatique" },
          events: [dtoEvent],
        },
      ])
      mockUpdateName.mockRejectedValueOnce(new Error("sqlite boom"))

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(mockRefreshActivity).toHaveBeenCalledTimes(1)
    })

    // THE EPIC ACCEPTANCE CRITERION: "a calendar-sync success must remain a
    // success when the Activity refresh fails."
    it("keeps the sync a success when the Activity refresh reports a failure", async () => {
      mockFetch.mockResolvedValueOnce(syncResponse)
      mockRefreshActivity.mockResolvedValue({
        status: "failed",
        reason: "network",
      })

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      expect(result.current.isError).toBe(false)
      // Not recorded under ANY calendar context: an Activity fault is the
      // Activity coordinator's to report, and mis-attributing it here would bury
      // real sync faults.
      expect(mockRecordUnknownError).not.toHaveBeenCalled()
      // The events the student came for are stored exactly once and untouched by
      // the Activity outcome.
      expect(mockReplaceAll).toHaveBeenCalledTimes(1)
      expect(mockReplaceAll.mock.calls[0]?.[0]).toHaveLength(1)
    })

    it("does not hold isSyncing open while the Activity refresh is still running", async () => {
      // Unawaited by design: the calendar's spinner must not stay up on an
      // unrelated request. Driven by a deferred, never by a timer.
      const pending = deferred<{ status: string }>()
      mockFetch.mockResolvedValueOnce(syncResponse)
      mockRefreshActivity.mockReturnValue(pending.promise)

      const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
      await act(async () => {
        await result.current.sync()
      })

      // sync() has resolved and the spinner is down while the Activity request
      // is still in flight.
      expect(result.current.isSyncing).toBe(false)
      expect(result.current.isError).toBe(false)

      await act(async () => {
        pending.resolve({ status: "updated" })
        await pending.promise
      })
      expect(result.current.isError).toBe(false)
    })
  })

  it("forwards a non-Error replaceAll rejection to the seam under its tag", async () => {
    mockFetch.mockResolvedValueOnce(syncResponse)
    mockReplaceAll.mockRejectedValueOnce("plain string boom")

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // The seam (recordUnknownError) owns the non-Error normalization; sync just
    // forwards the raw rejection value under the "calendar/sync" tag.
    expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError.mock.calls[0]?.[0]).toBe("plain string boom")
    expect(mockRecordUnknownError.mock.calls[0]?.[1]).toBe("calendar/sync")
  })
})
