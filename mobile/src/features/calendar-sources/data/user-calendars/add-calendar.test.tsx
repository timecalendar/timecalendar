import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { customFetch } from "@/api/mutator"

import { useAddCalendar } from "./add-calendar"
import * as repository from "./repository"

// The persist-wiring proof (D9): the token → resolve → upsert chain. Mocks at the
// customFetch mutator seam (the designed seam — never the network; testing.md /
// data.md) and the repository's upsert. Drives the REAL generated create mutation
// + the REAL generated find-by-token resolve through a real QueryClient. Asserts
// the success chain (POST /calendars → GET /calendars/by-token → upsert with the
// mapped DTO) AND the failure paths (resolve rejects / upsert rejects → the hook
// rejects + flips isError, so the screen records via @/firebase + surfaces a11y).
jest.mock("@/api/mutator")
jest.spyOn(repository, "upsert").mockResolvedValue(undefined)

const mockFetch = customFetch as jest.Mock
const mockUpsert = repository.upsert as jest.Mock

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const dto = {
  id: "srv-id",
  token: "tok_123",
  name: "ENSEEIHT",
  schoolName: "ENSEEIHT",
  schoolId: "school-1",
  lastUpdatedAt: "2026-06-14T09:00:00.000Z",
  createdAt: "2026-06-10T08:00:00.000Z",
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpsert.mockResolvedValue(undefined)
})

describe("useAddCalendar", () => {
  it("posts the url, resolves by token, and upserts the mapped durable row", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" }) // POST /calendars
      .mockResolvedValueOnce(dto) // GET /calendars/by-token/tok_123

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await act(async () => {
      await result.current.addCalendarFromUrl("  https://example.com/cal.ics  ")
    })

    // POST with the trimmed body the create seam assembles.
    expect(mockFetch.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({ url: "https://example.com/cal.ics", customData: null }),
    )
    // GET resolves the token.
    expect(mockFetch.mock.calls[1]?.[0]).toBe("/calendars/by-token/tok_123")
    // The durable row is upserted, carrying the irreplaceable token + metadata.
    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const persisted = mockUpsert.mock.calls[0]?.[0]
    expect(persisted.id).toBe("srv-id")
    expect(persisted.token).toBe("tok_123")
    expect(persisted.name).toBe("ENSEEIHT")
    expect(persisted.visible).toBe(true)
    expect(persisted.lastUpdatedAt).toBeInstanceOf(Date)
  })

  it("rejects and flips isError when the token resolve fails (no upsert)", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockRejectedValueOnce(new Error("resolve boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await expect(
      act(async () => {
        await result.current.addCalendarFromUrl("https://example.com/cal.ics")
      }),
    ).rejects.toThrow("resolve boom")

    expect(mockUpsert).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("rejects and flips isError when the durable upsert fails", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)
    mockUpsert.mockRejectedValueOnce(new Error("upsert boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await expect(
      act(async () => {
        await result.current.addCalendarFromUrl("https://example.com/cal.ics")
      }),
    ).rejects.toThrow("upsert boom")

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("reset clears the error state", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockRejectedValueOnce(new Error("boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await expect(
      act(async () => {
        await result.current.addCalendarFromUrl("https://example.com/cal.ics")
      }),
    ).rejects.toThrow("boom")
    await waitFor(() => expect(result.current.isError).toBe(true))

    act(() => {
      result.current.reset()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))
  })
})
