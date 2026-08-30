import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"
import { recordUnknownError } from "@/firebase"

import { useRenameCalendar } from "./rename"
import * as repository from "./repository"

// The rename-wiring proof: mocks at the customFetch mutator seam (the designed
// seam — never the network; testing.md / data.md) and the narrow local write, and
// drives the REAL generated PATCH mutation through a real QueryClient. It asserts
// the request shape (trimmed name on the token's URL), the D2 rule that the
// SERVER's returned name is what gets persisted, and the observability split: a
// request rejection is recoverable (no write, NOT recorded) while a rejected local
// write after a successful response IS recorded.
jest.mock("@/api/mutator")
jest.mock("@/firebase", () => ({ recordUnknownError: jest.fn() }))
jest.spyOn(repository, "updateName").mockResolvedValue(undefined)

const mockFetch = customFetch as jest.Mock
const mockUpdateName = repository.updateName as jest.Mock
const mockRecordUnknownError = recordUnknownError as jest.Mock

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const input = { id: "cal-1", token: "tok_123", name: "  L3 Informatique  " }

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdateName.mockResolvedValue(undefined)
})

afterEach(() => {
  mockFetch.mockReset()
  mockUpdateName.mockReset()
})

describe("useRenameCalendar", () => {
  it("PATCHes the trimmed name to the token and persists the SERVER's name", async () => {
    // The server normalizes; here it answers with a different casing than the
    // caller typed, so persisting the response is distinguishable from
    // persisting the input — the whole point of D2.
    mockFetch.mockResolvedValueOnce({
      id: "cal-1",
      token: "tok_123",
      name: "L3 informatique",
      schoolName: null,
      lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
    })

    const { result } = await renderHook(() => useRenameCalendar(), { wrapper })
    await act(async () => {
      await result.current.rename(input)
    })

    expect(mockFetch.mock.calls[0]?.[0]).toBe("/v1/calendars/tok_123")
    expect(mockFetch.mock.calls[0]?.[1].method).toBe("PATCH")
    expect(mockFetch.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({ name: "L3 Informatique" }),
    )
    expect(mockUpdateName).toHaveBeenCalledWith("cal-1", "L3 informatique")
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isError).toBe(false))
  })

  it("sends an empty name unchanged — an empty name is legal, not a client error", async () => {
    mockFetch.mockResolvedValueOnce({
      id: "cal-1",
      token: "tok_123",
      name: "",
      schoolName: null,
      lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
    })

    const { result } = await renderHook(() => useRenameCalendar(), { wrapper })
    await act(async () => {
      await result.current.rename({ ...input, name: "   " })
    })

    expect(mockFetch.mock.calls[0]?.[1].body).toBe(JSON.stringify({ name: "" }))
    expect(mockUpdateName).toHaveBeenCalledWith("cal-1", "")
  })

  it("rejects, writes nothing, and does NOT record when the request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    const { result } = await renderHook(() => useRenameCalendar(), { wrapper })
    await act(async () => {
      await expect(result.current.rename(input)).rejects.toThrow("offline")
    })

    // Recoverable, mirroring the fetch posture: the last-good local name stands
    // and the dialog offers Retry.
    expect(mockUpdateName).not.toHaveBeenCalled()
    expect(mockRecordUnknownError).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("records a local write failure after a successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      id: "cal-1",
      token: "tok_123",
      name: "L3 Informatique",
      schoolName: null,
      lastUpdatedAt: "2026-06-14T09:00:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
    })
    mockUpdateName.mockRejectedValueOnce(new Error("sqlite boom"))

    const { result } = await renderHook(() => useRenameCalendar(), { wrapper })
    // The rejection is asserted INSIDE act: letting it escape the act scope
    // aborts the scope before the queued work settles, so the write and the
    // record would go unobserved.
    await act(async () => {
      await expect(result.current.rename(input)).rejects.toThrow("sqlite boom")
    })

    expect(mockUpdateName).toHaveBeenCalledWith("cal-1", "L3 Informatique")
    expect(mockRecordUnknownError).toHaveBeenCalledTimes(1)
    expect(mockRecordUnknownError.mock.calls[0]?.[1]).toBe(
      "user-calendars/rename",
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("holds isPending across the whole request → local-write chain", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    let resolveWrite: (() => void) | undefined
    mockUpdateName.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveWrite = resolve
      }),
    )

    const { result } = await renderHook(() => useRenameCalendar(), { wrapper })
    let pending: Promise<void> | undefined
    await act(() => {
      pending = result.current.rename(input)
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))

    // Still pending once the response has landed but the local write has not:
    // the chain is one operation, not just the mutation's own state.
    await act(async () => {
      resolveFetch?.({
        id: "cal-1",
        token: "tok_123",
        name: "L3 Informatique",
        schoolName: null,
        lastUpdatedAt: "2026-06-14T09:00:00.000Z",
        createdAt: "2026-06-10T08:00:00.000Z",
      })
    })
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      resolveWrite?.()
      await pending
    })
    await waitFor(() => expect(result.current.isPending).toBe(false))
  })

  it("reset clears the error state", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"))

    const { result } = await renderHook(() => useRenameCalendar(), { wrapper })
    await act(async () => {
      await expect(result.current.rename(input)).rejects.toThrow("offline")
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    await act(() => {
      result.current.reset()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))
  })
})
