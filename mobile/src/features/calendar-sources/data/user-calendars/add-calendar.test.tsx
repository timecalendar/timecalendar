import { act, renderHook, waitFor } from "@testing-library/react-native"

import { customFetch } from "@/api/mutator"
import { createTestQueryClient } from "@/test-support/query-client"

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

const queryHarness = createTestQueryClient()
const wrapper = queryHarness.wrapper

const dto = {
  id: "srv-id",
  token: "tok_123",
  name: "ENSEEIHT",
  schoolName: "ENSEEIHT",
  schoolId: "school-1",
  lastUpdatedAt: "2026-06-14T09:00:00.000Z",
  createdAt: "2026-06-10T08:00:00.000Z",
}

async function expectActRejection(
  action: () => Promise<unknown>,
  expected: Error,
) {
  let rejection: unknown
  await act(async () => {
    try {
      await action()
    } catch (error) {
      rejection = error
    }
  })
  expect(rejection).toEqual(expected)
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpsert.mockResolvedValue(undefined)
})

afterEach(() => {
  queryHarness.clear()
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
    await expectActRejection(
      () =>
        result.current.addCalendarFromUrl("https://example.com/cal.ics", {
          name: "",
          schoolName: "",
        }),
      new Error("resolve boom"),
    )

    expect(mockUpsert).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("retries create only when no token was returned", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("create boom"))
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)
    const { result } = await renderHook(() => useAddCalendar(), { wrapper })
    const invoke = () =>
      result.current.addCalendarFromUrl("https://example.com/cal.ics", {
        name: "",
        schoolName: "",
      })

    await expectActRejection(invoke, new Error("create boom"))
    await act(async () => invoke())

    expect(
      mockFetch.mock.calls.filter(([path]) => path === "/calendars"),
    ).toHaveLength(2)
    expect(
      mockFetch.mock.calls.filter(([path]) =>
        String(path).includes("by-token"),
      ),
    ).toHaveLength(1)
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it("retries resolve without recreating after a token checkpoint", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockRejectedValueOnce(new Error("resolve boom"))
      .mockResolvedValueOnce(dto)
    const { result } = await renderHook(() => useAddCalendar(), { wrapper })
    const invoke = () =>
      result.current.addCalendarFromUrl("https://example.com/cal.ics", {
        name: "",
        schoolName: "",
      })

    await expectActRejection(invoke, new Error("resolve boom"))
    await act(async () => invoke())

    expect(
      mockFetch.mock.calls.filter(([path]) => path === "/calendars"),
    ).toHaveLength(1)
    expect(
      mockFetch.mock.calls.filter(([path]) =>
        String(path).includes("by-token"),
      ),
    ).toHaveLength(2)
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it("reset clears the error state", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockRejectedValueOnce(new Error("boom"))

    const { result } = await renderHook(() => useAddCalendar(), { wrapper })
    await expectActRejection(
      () =>
        result.current.addCalendarFromUrl("https://example.com/cal.ics", {
          name: "",
          schoolName: "",
        }),
      new Error("boom"),
    )
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
    await expectActRejection(
      () =>
        result.current.addCalendarFromUrl("https://example.com/cal.ics", {
          name: "",
          schoolName: "",
        }),
      new Error("upsert boom"),
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it("retries only the durable upsert after the DTO checkpoint", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_123" })
      .mockResolvedValueOnce(dto)
    mockUpsert
      .mockRejectedValueOnce(new Error("upsert boom"))
      .mockResolvedValueOnce(undefined)
    const { result } = await renderHook(() => useAddCalendar(), { wrapper })
    const invoke = () =>
      result.current.addCalendarFromUrl("https://example.com/cal.ics", {
        name: "",
        schoolName: "",
      })

    await expectActRejection(invoke, new Error("upsert boom"))
    await act(async () => invoke())

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockUpsert).toHaveBeenCalledTimes(2)
  })

  it("joins concurrent invocations and commits durable completion once", async () => {
    const create = deferred<{ token: string }>()
    mockFetch.mockReturnValueOnce(create.promise).mockResolvedValueOnce(dto)
    const { result } = await renderHook(() => useAddCalendar(), { wrapper })
    const invoke = () =>
      result.current.addCalendarFromUrl("https://example.com/cal.ics", {
        name: "",
        schoolName: "",
      })

    let first!: Promise<void>
    let duplicate!: Promise<void>
    await act(async () => {
      first = invoke()
      duplicate = invoke()
      await Promise.resolve()
    })
    expect(duplicate).toBe(first)
    await act(async () => {
      create.resolve({ token: "tok_123" })
      await Promise.all([first, duplicate])
    })
    await act(async () => invoke())

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it("starts a clean checkpoint for a materially new source", async () => {
    mockFetch
      .mockResolvedValueOnce({ token: "tok_old" })
      .mockRejectedValueOnce(new Error("old resolve"))
      .mockResolvedValueOnce({ token: "tok_new" })
      .mockResolvedValueOnce({ ...dto, token: "tok_new" })
    const { result } = await renderHook(() => useAddCalendar(), { wrapper })

    await expectActRejection(
      () =>
        result.current.addCalendarFromUrl("https://example.com/old.ics", {
          name: "Old",
          schoolName: "",
        }),
      new Error("old resolve"),
    )
    await act(async () =>
      result.current.addCalendarFromUrl("https://example.com/new.ics", {
        name: "New",
        schoolName: "",
      }),
    )

    expect(
      mockFetch.mock.calls.filter(([path]) => path === "/calendars"),
    ).toHaveLength(2)
    expect(mockFetch.mock.calls[3]?.[0]).toBe("/calendars/by-token/tok_new")
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
