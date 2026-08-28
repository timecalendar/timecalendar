import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"
import { findAll as findAllUserCalendars } from "@/features/calendar-sources/data/user-calendars"
import {
  getSourceHealthSnapshot,
  replaceSourceHealthSnapshot,
  SOURCE_HEALTH_KEY,
} from "@/features/calendar-sources/store"
import * as sourceHealthStore from "@/features/calendar-sources/store/store"
import { recordUnknownError } from "@/firebase"
import { remove } from "@/storage"

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
jest.mock("@/features/calendar-sources/data/user-calendars", () => ({
  findAll: jest.fn(),
}))
jest.spyOn(repository, "replaceAll").mockResolvedValue(undefined)

const mockFetch = customFetch as jest.Mock
const mockFindAll = findAllUserCalendars as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock
const mockReplaceAll = repository.replaceAll as jest.Mock
const actualReplaceSourceHealthSnapshot =
  sourceHealthStore.replaceSourceHealthSnapshot
const mockReplaceSourceHealthSnapshot = jest.spyOn(
  sourceHealthStore,
  "replaceSourceHealthSnapshot",
)

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
    sourceHealth: {
      status: "stale",
      reason: "expired_export_window",
      recoveryAction: "re_add",
      guide: null,
    },
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockReplaceAll.mockResolvedValue(undefined)
  mockFindAll.mockResolvedValue([calendarToken])
  remove(SOURCE_HEALTH_KEY)
  mockReplaceSourceHealthSnapshot.mockImplementation(
    actualReplaceSourceHealthSnapshot,
  )
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
    expect(getSourceHealthSnapshot()).toEqual({
      "cal-1": syncResponse[0]!.sourceHealth,
    })
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
    replaceSourceHealthSnapshot({
      previous: {
        status: "unknown",
        reason: null,
        recoveryAction: null,
        guide: null,
      },
    })
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockReplaceAll).not.toHaveBeenCalled()
    // A fetch failure is recoverable — the last-good rows render; NOT recorded.
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
    expect(getSourceHealthSnapshot()).toHaveProperty("previous")
  })

  it("records a replaceAll transaction failure (crash-worthy local write)", async () => {
    replaceSourceHealthSnapshot({
      previous: {
        status: "unknown",
        reason: null,
        recoveryAction: null,
        guide: null,
      },
    })
    mockFetch.mockResolvedValueOnce(syncResponse)
    mockReplaceAll.mockRejectedValueOnce(new Error("sqlite boom"))

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError.mock.calls[0]?.[1]).toBe("calendar/sync")
    expect(getSourceHealthSnapshot()).toHaveProperty("previous")
  })

  it("writes health after events and records a privacy-safe health failure", async () => {
    mockFetch.mockResolvedValueOnce(syncResponse)
    mockReplaceSourceHealthSnapshot.mockImplementationOnce(() => {
      throw new Error("mmkv boom")
    })

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })

    expect(mockReplaceAll).toHaveBeenCalledTimes(1)
    expect(mockReplaceSourceHealthSnapshot).toHaveBeenCalledTimes(1)
    expect(mockReplaceAll.mock.invocationCallOrder[0]!).toBeLessThan(
      mockReplaceSourceHealthSnapshot.mock.invocationCallOrder[0]!,
    )
    expect(mockRecordUnknownError).toHaveBeenCalledWith(
      expect.any(Error),
      "calendar/source-health",
    )
    expect(result.current.isError).toBe(true)
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

  it("reset clears the error state", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    const { result } = await renderHook(() => useSyncCalendars(), { wrapper })
    await act(async () => {
      await result.current.sync()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    act(() => {
      result.current.reset()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))
  })
})
