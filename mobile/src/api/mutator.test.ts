import { PRODUCTION_API_URL } from "@/config/backend-environment"
import * as backendRuntime from "@/config/backend-runtime"

import {
  ApiError,
  cancelInFlightApiRequests,
  customFetch,
  customFetchResponse,
} from "./mutator"

// The mutator's first DIRECT unit test — the one place `@/api/mutator` is NOT
// itself mocked (every feature suite jest.mock()s it). It proves the seam's
// contract against a mocked `globalThis.fetch`: non-2xx → ApiError, the parseBody
// text fallback, and the timeout / caller-signal cancellation forwarding.

const jsonResponse = (
  status: number,
  body: unknown,
  headers: HeadersInit = {},
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => JSON.stringify(body),
  }) as Response

const textResponse = (
  status: number,
  text: string,
  headers: HeadersInit = {},
): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => text,
  }) as Response

const realFetch = globalThis.fetch
let fetchMock: jest.Mock

beforeEach(() => {
  fetchMock = jest.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  cancelInFlightApiRequests()
  globalThis.fetch = realFetch
  jest.useRealTimers()
})

describe("customFetchResponse", () => {
  it("preserves status, Headers, and parsed data for every HTTP status", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, { version: "v1" }, { ETag: '"strong"' }),
      )
      .mockResolvedValueOnce(
        textResponse(304, "", { "Content-Language": "fr" }),
      )
      .mockResolvedValueOnce(textResponse(503, "temporarily unavailable"))

    const success = await customFetchResponse<{ version: string }>(
      "/v1/export-guides?locale=fr&clientSchema=1",
      {},
    )
    expect(success.status).toBe(200)
    expect(success.headers).toBeInstanceOf(Headers)
    expect(success.headers.get("etag")).toBe('"strong"')
    expect(success.data).toEqual({ version: "v1" })

    await expect(
      customFetchResponse("/v1/export-guides?locale=fr&clientSchema=1", {}),
    ).resolves.toEqual({
      status: 304,
      headers: expect.any(Headers),
      data: undefined,
    })
    await expect(customFetchResponse("/status", {})).resolves.toEqual({
      status: 503,
      headers: expect.any(Headers),
      data: "temporarily unavailable",
    })
  })

  it.each([
    ["ASCII", JSON.stringify("a".repeat(512 * 1024 - 2))],
    ["multibyte", JSON.stringify("é".repeat((512 * 1024 - 2) / 2))],
    ["three-byte", JSON.stringify("界".repeat((512 * 1024 - 2) / 3))],
    ["four-byte", JSON.stringify(`aa${"😀".repeat((512 * 1024 - 4) / 4)}`)],
  ])("accepts a %s JSON body at exactly 512 KiB", async (_kind, body) => {
    fetchMock.mockResolvedValueOnce(textResponse(200, body))
    await expect(
      customFetchResponse("/v1/export-guides?locale=en&clientSchema=1", {}),
    ).resolves.toEqual(expect.objectContaining({ status: 200 }))
  })

  it("rejects an export-guide body above 512 KiB before parsing", async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse(200, JSON.stringify("é".repeat(256 * 1024))),
    )

    await expect(
      customFetchResponse("/v1/export-guides?locale=en&clientSchema=1", {}),
    ).rejects.toMatchObject({ failure: "oversized_body" })
  })

  it("rejects malformed export-guide JSON with a static transport error", async () => {
    fetchMock.mockResolvedValueOnce(textResponse(200, "distinctive raw body"))

    await expect(
      customFetchResponse("/v1/export-guides?locale=en&clientSchema=1", {}),
    ).rejects.toMatchObject({ failure: "malformed_body" })
  })

  it("forwards already-aborted and live caller cancellation", async () => {
    const alreadyAborted = new AbortController()
    alreadyAborted.abort()
    fetchMock.mockResolvedValueOnce(textResponse(304, ""))
    await customFetchResponse("/v1/export-guides", {
      signal: alreadyAborted.signal,
    })
    expect((fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal).aborted).toBe(
      true,
    )

    jest.useFakeTimers()
    fetchMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(Object.assign(new Error("abort"), { name: "AbortError" })),
          )
        }),
    )
    const live = new AbortController()
    const pending = customFetchResponse("/v1/export-guides", {
      signal: live.signal,
    }).catch(() => undefined)
    const passed = fetchMock.mock.calls[1]?.[1]?.signal as AbortSignal
    expect(passed.aborted).toBe(false)
    live.abort()
    expect(passed.aborted).toBe(true)
    await pending
  })

  it("shares timeout and reset cancellation and clears settled timers", async () => {
    jest.useFakeTimers()
    const rejectingFetch = (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(Object.assign(new Error("abort"), { name: "AbortError" })),
        )
      })
    fetchMock.mockImplementationOnce(rejectingFetch)
    const timedRequest = customFetchResponse("/v1/export-guides", {}).catch(
      () => undefined,
    )
    const timed = fetchMock.mock.calls[0]?.[1]?.signal as AbortSignal
    jest.advanceTimersByTime(15000)
    expect(timed.aborted).toBe(true)
    await timedRequest

    fetchMock.mockImplementationOnce(rejectingFetch)
    const resetRequest = customFetchResponse("/v1/export-guides", {}).catch(
      () => undefined,
    )
    const reset = fetchMock.mock.calls[1]?.[1]?.signal as AbortSignal
    cancelInFlightApiRequests()
    expect(reset.aborted).toBe(true)
    await resetRequest

    fetchMock.mockResolvedValueOnce(textResponse(304, ""))
    await customFetchResponse("/v1/export-guides", {})
    expect(jest.getTimerCount()).toBe(0)
  })

  it("keeps export-guide diagnostics bounded and payload-free", async () => {
    const log = jest.spyOn(console, "log").mockImplementation()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(
          200,
          { copy: "distinctive guide copy" },
          { ETag: '"private-etag"', "X-Private": "response-secret" },
        ),
      )
      .mockRejectedValueOnce(new Error("distinctive thrown message"))

    await customFetchResponse(
      "/v1/export-guides?locale=fr&catalogueVersion=private-version",
      {
        headers: { "If-None-Match": '"private-request-etag"' },
        body: "private-request-body",
      },
    )
    await customFetchResponse(
      "/v1/export-guides?locale=fr&catalogueVersion=private-version",
      {},
    ).catch(() => undefined)

    expect(log.mock.calls).toEqual([
      [
        "[api] ← GET /v1/export-guides status=200 duration=lt_250ms outcome=response",
      ],
      [
        "[api] ← GET /v1/export-guides duration=lt_250ms outcome=transport_error",
      ],
    ])
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /private|distinctive|guide copy|response-secret|request-body|thrown message/,
    )
    log.mockRestore()
  })

  it.each([
    [500, "lt_1s"],
    [2000, "lt_5s"],
  ])("uses a coarse duration bucket at %sms", async (duration, bucket) => {
    const log = jest.spyOn(console, "log").mockImplementation()
    const now = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1000 + duration)
    fetchMock.mockResolvedValueOnce(textResponse(304, ""))
    await customFetchResponse("/v1/export-guides", {})
    expect(JSON.stringify(log.mock.calls)).toContain(`duration=${bucket}`)
    now.mockRestore()
    log.mockRestore()
  })

  it("fails before fetch while the backend runtime is resetting", async () => {
    const ready = jest
      .spyOn(backendRuntime, "isBackendRuntimeReady")
      .mockReturnValueOnce(false)
    await expect(customFetchResponse("/v1/export-guides", {})).rejects.toThrow(
      "Backend runtime is resetting",
    )
    expect(fetchMock).not.toHaveBeenCalled()
    ready.mockRestore()
  })
})

describe("customFetch", () => {
  it("resolves with the parsed body and targets <baseURL><url> with JSON headers", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "e-1" }))

    const result = await customFetch<{ id: string }>("/events/e-1", {})

    expect(result).toEqual({ id: "e-1" })
    expect(fetchMock).toHaveBeenCalledWith(
      `${PRODUCTION_API_URL}/events/e-1`,
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

  it("redacts contact request and response bodies from development diagnostics", async () => {
    const log = jest.spyOn(console, "log").mockImplementation()
    fetchMock.mockResolvedValue(
      jsonResponse(503, {
        message: "private response echo",
        email: "private@example.fr",
      }),
    )

    await customFetch("/contact", {
      method: "POST",
      body: JSON.stringify({
        email: "private@example.fr",
        message: "private submitted message",
      }),
    }).catch(() => undefined)

    expect(log.mock.calls).toEqual([
      ["[api] → POST /contact"],
      ["[api] ← 503 POST /contact"],
    ])
    expect(JSON.stringify(log.mock.calls)).not.toMatch(
      /private|example\.fr|submitted message|response echo/,
    )
    log.mockRestore()
  })

  it("keeps payload diagnostics for non-sensitive API paths", async () => {
    const log = jest.spyOn(console, "log").mockImplementation()
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "event-1" }))

    await customFetch("/events", {
      method: "POST",
      body: JSON.stringify({ title: "Lecture" }),
    })

    expect(log).toHaveBeenNthCalledWith(
      1,
      `[api] → POST ${PRODUCTION_API_URL}/events`,
      JSON.stringify({ title: "Lecture" }),
    )
    expect(log).toHaveBeenNthCalledWith(
      2,
      `[api] ← 200 POST ${PRODUCTION_API_URL}/events`,
      { id: "event-1" },
    )
    log.mockRestore()
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
