import { API_BASE_URL } from "./config"
import { ApiError, customFetch } from "./mutator"

// The mutator's first DIRECT unit test — the one place `@/api/mutator` is NOT
// itself mocked (every feature suite jest.mock()s it). It proves the seam's
// contract against a mocked `globalThis.fetch`: non-2xx → ApiError, the parseBody
// text fallback, and the timeout / caller-signal cancellation forwarding.

const jsonResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  }) as Response

const textResponse = (status: number, text: string): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  }) as Response

const realFetch = globalThis.fetch
let fetchMock: jest.Mock

beforeEach(() => {
  fetchMock = jest.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = realFetch
  jest.useRealTimers()
})

describe("customFetch", () => {
  it("resolves with the parsed body and targets <baseURL><url> with JSON headers", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "e-1" }))

    const result = await customFetch<{ id: string }>("/events/e-1", {})

    expect(result).toEqual({ id: "e-1" })
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/events/e-1`,
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    )
  })

  it("sets Content-Type when a request body is sent", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}))

    await customFetch("/events", { method: "POST", body: JSON.stringify({}) })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    )
  })

  it("rejects a non-2xx response with an ApiError carrying the status + parsed body", async () => {
    fetchMock.mockResolvedValue(jsonResponse(422, { message: "invalid" }))

    const error = await customFetch("/events", { method: "POST" }).catch(
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(422)
    expect((error as ApiError).body).toEqual({ message: "invalid" })
  })

  it("falls back to the raw text body when the response is not JSON", async () => {
    fetchMock.mockResolvedValue(textResponse(200, "plain text"))

    await expect(customFetch("/ping", {})).resolves.toBe("plain text")
  })

  it("resolves undefined for an empty response body", async () => {
    fetchMock.mockResolvedValue(textResponse(204, ""))

    await expect(
      customFetch("/events/e-1", { method: "DELETE" }),
    ).resolves.toBeUndefined()
  })

  it("forwards an already-aborted caller signal to the underlying fetch", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}))
    const controller = new AbortController()
    controller.abort()

    await customFetch("/events", { signal: controller.signal })

    const passedSignal = fetchMock.mock.calls[0][1]?.signal as AbortSignal
    expect(passedSignal.aborted).toBe(true)
  })

  it("cancels an in-flight request when a live caller signal later aborts", () => {
    // Fake timers so the never-settling fetch's internal timeout timer does not
    // leak into the event loop (it is cleared only in `finally`, which never runs
    // here). We drive the abort via the caller signal, not the clock.
    jest.useFakeTimers()
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))
    const controller = new AbortController()

    void customFetch("/events", { signal: controller.signal })

    const passedSignal = fetchMock.mock.calls[0][1]?.signal as AbortSignal
    expect(passedSignal.aborted).toBe(false)
    controller.abort()
    expect(passedSignal.aborted).toBe(true)
  })

  it("aborts a never-resolving request once the default timeout elapses", () => {
    jest.useFakeTimers()
    fetchMock.mockReturnValue(new Promise<Response>(() => {}))

    void customFetch("/events", {})

    const passedSignal = fetchMock.mock.calls[0][1]?.signal as AbortSignal
    expect(passedSignal.aborted).toBe(false)
    jest.advanceTimersByTime(15000)
    expect(passedSignal.aborted).toBe(true)
  })
})
