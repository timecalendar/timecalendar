import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react-native"
import type { ReactNode } from "react"

import { ApiError, customFetch } from "@/api/mutator"
import { recordError } from "@/firebase"

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
jest.mock("@/firebase", () => ({ recordError: jest.fn() }))
jest.spyOn(repository, "upsert").mockResolvedValue(undefined)

const mockFetch = customFetch as jest.Mock
const mockUpsert = repository.upsert as jest.Mock
const mockRecordError = recordError as jest.Mock

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } },
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
  const runRejected = async (action: () => Promise<void>): Promise<unknown> => {
    let caught: unknown
    await act(async () => {
      try {
        await action()
      } catch (error) {
        caught = error
      }
    })
    return caught
  }

  it("posts the url, resolves by token, and upserts the mapped durable row", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" }) // POST /calendars
      .mockResolvedValueOnce(dto) // GET /calendars/by-token/tok_123

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await act(async () => {
      await result.current.addCalendarFromUrl(
        "  https://example.com/cal.ics  ",
        { schoolId: "school-1", schoolName: "ENSEEIHT" },
      )
    })

    expect(mockFetch.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({
        url: "https://example.com/cal.ics",
        schoolId: "school-1",
        name: "ENSEEIHT",
        customData: null,
      }),
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
    expect(mockRecordError).not.toHaveBeenCalled()
  })

  it("uses a bounded custom-school fallback when no school is selected", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)
    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await act(async () => {
      await result.current.addCalendarFromUrl("https://example.com/cal.ics")
    })

    expect(mockFetch.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({
        url: "https://example.com/cal.ics",
        schoolName: "Imported calendar",
        name: "Imported calendar",
        customData: null,
      }),
    )
  })

  it("rejects and flips isError when the token resolve fails (no upsert)", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockRejectedValueOnce(new Error("resolve boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    const caught = await runRejected(() =>
      result.current.addCalendarFromUrl("https://example.com/cal.ics"),
    )
    expect(caught).toMatchObject({
      message: "calendar_import_failed:unknown:generic_unknown",
    })

    expect(mockUpsert).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.recovery).toEqual({
      classification: "unknown",
      helpKey: "generic_unknown",
      retryable: true,
    })
  })

  it("rejects and flips isError when the durable upsert fails", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)
    mockUpsert.mockRejectedValueOnce(new Error("upsert boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    const caught = await runRejected(() =>
      result.current.addCalendarFromUrl("https://example.com/cal.ics"),
    )
    expect(caught).toMatchObject({
      message: "calendar_import_failed:unknown:generic_unknown",
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("reset clears the error state", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockRejectedValueOnce(new Error("boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    const caught = await runRejected(() =>
      result.current.addCalendarFromUrl("https://example.com/cal.ics"),
    )
    expect(caught).toMatchObject({
      message: "calendar_import_failed:unknown:generic_unknown",
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    await act(async () => {
      result.current.reset()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))
    expect(result.current.recovery).toBeNull()
  })

  it("maps a typed create failure and records only a sanitized replacement", async () => {
    const sentinelUrl =
      "https://synthetic-login:synthetic-password@example.test/resource-123"
    mockFetch.mockRejectedValueOnce(
      new ApiError(422, {
        code: "calendar_import_failed",
        classification: "unsupported_link",
        helpKey: "tours_export",
        retryable: false,
        // Exact-body validation discards an unexpected raw field.
        rawUrl: sentinelUrl,
      }),
    )
    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    const caught = await runRejected(() =>
      result.current.addCalendarFromUrl(sentinelUrl),
    )
    expect(caught).toMatchObject({
      message: "calendar_import_failed:unknown:generic_unknown",
    })

    expect(mockRecordError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "calendar_import_failed:unknown:generic_unknown",
      }),
      "calendar-sources/ical-import",
    )
    expect(JSON.stringify(mockRecordError.mock.calls)).not.toContain(
      "synthetic-password",
    )
    expect(JSON.stringify(mockRecordError.mock.calls)).not.toContain(
      "resource-123",
    )
  })
})
