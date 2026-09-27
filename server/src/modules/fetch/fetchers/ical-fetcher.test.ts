import { readFileSync } from "fs"
import { join } from "path"
import { setupMsw } from "test-utils/setup-msw"
import { delay, http, HttpResponse } from "msw"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { BadRequestException } from "@nestjs/common"
import { CalendarSyncAbortError } from "modules/calendar-sync/models/calendar-sync-context"
import { CustomError } from "modules/shared/errors/custom-error"
import axios, { AxiosError } from "axios"

const server = setupMsw()

describe("IcalFetcher", () => {
  const validIcal = readFileSync(join(__dirname, "__tests__/ical.ics"), "utf-8")

  const responseError = (status: number, retryAfter?: string) =>
    new AxiosError(
      "provider detail",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status,
        statusText: "provider detail",
        headers: { ...(retryAfter ? { "retry-after": retryAfter } : {}) },
        config: { headers: {} as never },
        data: "provider content",
      },
    )

  it.each([
    ["timeout", Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }), 2],
    [
      "connection_reset",
      Object.assign(new Error("reset"), { code: "ECONNRESET" }),
      2,
    ],
    ["rate_limited", responseError(429), 2],
    ["bad_gateway", responseError(502), 2],
    ["service_unavailable", responseError(503), 2],
    ["gateway_timeout", responseError(504), 2],
    ["authentication", responseError(403), 1],
    ["http_client", responseError(404), 1],
    [
      "tls",
      Object.assign(new Error("certificate"), { code: "CERT_HAS_EXPIRED" }),
      1,
    ],
    [
      "dns_permanent",
      Object.assign(new Error("dns"), { code: "ENOTFOUND" }),
      1,
    ],
    ["unknown", new Error("unclassified"), 1],
  ] as const)(
    "%s has the expected upstream attempt count",
    async (classification, firstError, expectedAttempts) => {
      const request = jest
        .spyOn(axios, "request")
        .mockRejectedValueOnce(firstError)
        .mockResolvedValue({ data: validIcal })
      const fetch = new IcalFetcher({ withRetries: true }).fetch(
        "https://example.com",
      )
      if (expectedAttempts === 2) {
        await expect(fetch).resolves.toHaveLength(1)
      } else {
        await expect(fetch).rejects.toMatchObject({ classification })
      }
      expect(request).toHaveBeenCalledTimes(expectedAttempts)
      request.mockRestore()
    },
  )

  it.each([
    [
      "ui_link",
      "https://example.com/jsp/custom/modules/plannings/index.jsp",
      "bad content",
      1,
    ],
    ["invalid_url", "not a URL", "bad content", 0],
    ["no_events", "https://example.com", "", 1],
    ["invalid_ical", "https://example.com", {} as string, 1],
  ] as const)(
    "%s is terminal with a bounded attempt count",
    async (classification, url, content, expectedAttempts) => {
      const request = jest
        .spyOn(axios, "request")
        .mockResolvedValue({ data: content })
      await expect(
        new IcalFetcher({ withRetries: true }).fetch(url),
      ).rejects.toMatchObject({ classification })
      expect(request).toHaveBeenCalledTimes(expectedAttempts)
      request.mockRestore()
    },
  )

  it.each([
    ["2", 2_000, 2],
    ["9", 0, 1],
    ["10", 0, 1],
    ["malformed", 0, 2],
  ])(
    "bounds a 429 Retry-After of %s",
    async (header, expectedWait, expectedAttempts) => {
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })
      const request = jest
        .spyOn(axios, "request")
        .mockRejectedValueOnce(responseError(429, header))
        .mockResolvedValue({ data: validIcal })
      const fetch = new IcalFetcher({ withRetries: true }).fetch(
        "https://example.com",
      )
      if (expectedWait) await jest.advanceTimersByTimeAsync(expectedWait)
      if (expectedAttempts === 2) await expect(fetch).resolves.toHaveLength(1)
      else
        await expect(fetch).rejects.toMatchObject({
          classification: "rate_limited",
        })
      expect(request).toHaveBeenCalledTimes(expectedAttempts)
      request.mockRestore()
      jest.useRealTimers()
    },
  )

  it("cancels during Retry-After without a second attempt", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })
    const controller = new AbortController()
    const reason = new CalendarSyncAbortError("client_cancelled")
    const request = jest
      .spyOn(axios, "request")
      .mockRejectedValue(responseError(429, "2"))
    const fetch = new IcalFetcher({ withRetries: true }).fetch(
      "https://example.com",
      undefined,
      { signal: controller.signal },
    )
    await Promise.resolve()
    controller.abort(reason)
    await expect(fetch).rejects.toBe(reason)
    expect(request).toHaveBeenCalledTimes(1)
    request.mockRestore()
    jest.useRealTimers()
  })
  it("should return events", async () => {
    server.use(
      http.get("https://example.com", function () {
        return new HttpResponse(
          readFileSync(join(__dirname, "__tests__/ical.ics"), "utf-8"),
        )
      }),
    )

    const fetcher = new IcalFetcher({ withRetries: true })
    const events = await fetcher.fetch("https://example.com")

    expect(events).toHaveLength(1)
  })

  it("should throw an error if the request fails", async () => {
    server.use(
      http.get("https://example.com", function () {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    const fetcher = new IcalFetcher({ withRetries: false })

    await expect(fetcher.fetch("https://example.com")).rejects.toThrow(
      new BadRequestException(
        "Failed to request the API: Request failed with status code 500",
      ),
    )
  })

  it("should retry the request", async () => {
    let attempts = 0
    server.use(
      http.get("https://example.com", function* () {
        attempts++
        yield new HttpResponse(null, { status: 503 })
        attempts++
        yield new HttpResponse(
          readFileSync(join(__dirname, "__tests__/ical.ics"), "utf-8"),
        )
      }),
    )

    const fetcher = new IcalFetcher({ withRetries: true })
    const events = await fetcher.fetch("https://example.com")

    expect(events).toHaveLength(1)
    expect(attempts).toBe(2)
  })

  it("aborts transport work when the parent request is cancelled", async () => {
    server.use(
      http.get("https://example.com", async () => {
        await delay("infinite")
        return new HttpResponse(null)
      }),
    )
    const controller = new AbortController()
    const reason = new CalendarSyncAbortError("client_cancelled")
    const promise = new IcalFetcher({ withRetries: true }).fetch(
      "https://example.com",
      undefined,
      { signal: controller.signal },
    )

    controller.abort(reason)

    await expect(promise).rejects.toBe(reason)
  })

  it("settles a never-responding retry source within the shared budget", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] })
    server.use(
      http.get("https://example.com", async () => {
        await delay(20_000)
        return new HttpResponse(null)
      }),
    )
    const promise = new IcalFetcher({ withRetries: true }).fetch(
      "https://example.com",
    )
    const rejection = expect(promise).rejects.toThrow(BadRequestException)

    await jest.advanceTimersByTimeAsync(9_000)

    await rejection
    jest.useRealTimers()
  })

  it("does not retry a basic-auth challenge", async () => {
    let attempts = 0
    server.use(
      http.get("https://example.com", () => {
        attempts++
        return new HttpResponse(null, {
          status: 401,
          headers: { "www-authenticate": "Basic" },
        })
      }),
    )

    await expect(
      new IcalFetcher({ withRetries: true }).fetch("https://example.com"),
    ).rejects.toEqual(
      new CustomError("Basic Authorization required", { auth: "basic" }),
    )
    expect(attempts).toBe(1)
  })
})
