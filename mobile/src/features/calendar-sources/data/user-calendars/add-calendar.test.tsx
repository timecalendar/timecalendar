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

afterEach(() => {
  mockFetch.mockReset()
  mockUpsert.mockReset()
})

describe("useAddCalendar", () => {
  it("posts the url, resolves by token, and upserts the mapped durable row", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" }) // POST /calendars
      .mockResolvedValueOnce(dto) // GET /calendars/by-token/tok_123

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await act(async () => {
      await result.current.addCalendarFromUrl(
        "  https://example.com/cal.ics  ",
        {
          name: "L3 Informatique",
          schoolId: "school-1",
        },
      )
    })

    // POST with the trimmed body the create seam assembles from the caller's
    // import fields (TIM-391): the listed institution's id and the normalized
    // programme name, and NO schoolName key at all — the server validates each
    // institution field with @ValidateIf(other === undefined).
    expect(mockFetch.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({
        url: "https://example.com/cal.ics",
        name: "L3 Informatique",
        customData: null,
        schoolId: "school-1",
      }),
    )
    expect(
      Object.keys(JSON.parse(mockFetch.mock.calls[0]?.[1].body as string)),
    ).not.toContain("schoolName")
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
        await result.current.addCalendarFromUrl("https://example.com/cal.ics", {
          name: "",
          schoolName: "",
        })
      }),
    ).rejects.toThrow("resolve boom")

    expect(mockUpsert).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("reset clears the error state", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockRejectedValueOnce(new Error("boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await expect(
      act(async () => {
        await result.current.addCalendarFromUrl("https://example.com/cal.ics", {
          name: "",
          schoolName: "",
        })
      }),
    ).rejects.toThrow("boom")
    await waitFor(() => expect(result.current.isError).toBe(true))

    await act(() => {
      result.current.reset()
    })
    await waitFor(() => expect(result.current.isError).toBe(false))

    mockFetch.mockResolvedValueOnce({ token: "must-not-leak" })
    mockUpsert.mockRejectedValueOnce(new Error("must not leak"))
  })

  it("rejects and flips isError when the durable upsert fails", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)
    mockUpsert.mockRejectedValueOnce(new Error("upsert boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await expect(
      act(async () => {
        await result.current.addCalendarFromUrl("https://example.com/cal.ics", {
          name: "",
          schoolName: "",
        })
      }),
    ).rejects.toThrow("upsert boom")

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
  // The "exactly one institution representation" contract (TIM-391 / design D3),
  // asserted on the captured body at the mutator seam — key ABSENCE, not
  // `undefined`, because the server DTO validates each field with
  // @ValidateIf(other === undefined) and rejects a body carrying both keys.
  it.each([
    {
      label: "an unlisted institution sends schoolName and no schoolId",
      fields: { name: "L3 Informatique", schoolName: "École du Coin" },
      present: "schoolName",
      absent: "schoolId",
    },
    {
      label: "a direct route with no draft sends empty metadata",
      fields: { name: "", schoolName: "" },
      present: "schoolName",
      absent: "schoolId",
    },
  ])("$label", async ({ fields, present, absent }) => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await act(async () => {
      await result.current.addCalendarFromUrl(
        "https://example.com/cal.ics",
        fields,
      )
    })

    const body = JSON.parse(
      mockFetch.mock.calls[0]?.[1].body as string,
    ) as Record<string, unknown>
    expect(Object.keys(body)).toContain(present)
    expect(Object.keys(body)).not.toContain(absent)
    expect(body.name).toBe(fields.name)
    expect(body.schoolName).toBe(fields.schoolName)
  })

  it('sends name: "" when the programme step was skipped', async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await act(async () => {
      await result.current.addCalendarFromUrl("https://example.com/cal.ics", {
        name: "",
        schoolId: "school-1",
      })
    })

    const body = JSON.parse(
      mockFetch.mock.calls[0]?.[1].body as string,
    ) as Record<string, unknown>
    expect(body.name).toBe("")
    expect(body.schoolId).toBe("school-1")
    expect(Object.keys(body)).not.toContain("schoolName")
  })
})
