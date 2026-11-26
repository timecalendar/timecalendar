import { readFileSync } from "fs"
import { join } from "path"
import { inspect } from "util"
import { setupMsw } from "test-utils/setup-msw"
import { delay, http, HttpResponse } from "msw"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { BadRequestException } from "@nestjs/common"
import { CalendarSyncAbortError } from "modules/calendar-sync/models/calendar-sync-context"
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
    ["Sun, 27 Sep 2026 12:00:02 GMT", 2_000, 2],
    ["Sun, 27 Sep 2026 11:59:58 GMT", 0, 2],
    ["9", 0, 1],
    ["10", 0, 1],
    ["malformed", 0, 2],
  ])(
    "bounds a 429 Retry-After of %s",
    async (header, expectedWait, expectedAttempts) => {
      jest.useFakeTimers({
        doNotFake: ["nextTick", "setImmediate"],
        now: new Date("2026-09-27T12:00:00Z"),
      })
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

  it("treats a basic-auth challenge as an ordinary terminal failure", async () => {
    let attempts = 0
    const authorizationHeaders: (string | null)[] = []
    server.use(
      http.get("https://example.com", ({ request }) => {
        attempts++
        authorizationHeaders.push(request.headers.get("authorization"))
        return new HttpResponse(null, {
          status: 401,
          headers: { "www-authenticate": "Basic" },
        })
      }),
    )

    const onAttempt = jest.fn()
    const onFinal = jest.fn()
    const failure = await new IcalFetcher({ withRetries: true })
      .fetch("https://example.com", { onAttempt, onFinal })
      .catch((error) => error)
    expect(failure).toMatchObject({
      classification: "authentication",
      disposition: "terminal",
    })
    expect(failure.getResponse()).not.toHaveProperty("auth")
    expect(failure.getResponse()).not.toHaveProperty("basicAuth")
    expect(attempts).toBe(1)
    expect(onAttempt).toHaveBeenCalledTimes(1)
    expect(onFinal).toHaveBeenCalledWith("authentication", "terminal")
    expect(authorizationHeaders).toEqual([null])
  })

  describe("egress relay", () => {
    const relay = {
      host: "calendar.example.edu",
      path: "/plannings/cal.jsp",
      origin: "https://relay.example.com",
      clientId: "client-id.access",
      clientSecret: "client-secret",
    }

    it("sends the relayed path to the relay origin with the Access service token", async () => {
      const seen: { url: string; id: string | null; secret: string | null }[] =
        []
      server.use(
        http.get(
          "https://relay.example.com/plannings/cal.jsp",
          ({ request }) => {
            seen.push({
              url: request.url,
              id: request.headers.get("cf-access-client-id"),
              secret: request.headers.get("cf-access-client-secret"),
            })
            return HttpResponse.text(validIcal)
          },
        ),
      )

      const events = await new IcalFetcher({ relay }).fetch(
        "https://calendar.example.edu/plannings/cal.jsp?resources=1&projectId=2",
      )

      expect(events).toHaveLength(1)
      expect(seen).toEqual([
        {
          url: "https://relay.example.com/plannings/cal.jsp?resources=1&projectId=2",
          id: "client-id.access",
          secret: "client-secret",
        },
      ])
    })

    it("keeps the relay origin for a path that looks like another authority", async () => {
      const request = jest
        .spyOn(axios, "request")
        .mockResolvedValue({ data: validIcal })

      await new IcalFetcher({
        relay: { ...relay, path: "//evil.example/x" },
      }).fetch("https://calendar.example.edu//evil.example/x")

      expect(new URL(request.mock.calls[0][0].url!).host).toBe(
        "relay.example.com",
      )
      request.mockRestore()
    })

    it.each([
      ["another host", "https://other.example.edu/plannings/cal.jsp"],
      ["another path", "https://calendar.example.edu/plannings/other.jsp"],
    ])("fetches %s without the relay or the token", async (_, url) => {
      const request = jest
        .spyOn(axios, "request")
        .mockResolvedValue({ data: validIcal })

      await new IcalFetcher({ relay }).fetch(url)

      expect(request.mock.calls[0][0]).toMatchObject({ url })
      expect(request.mock.calls[0][0].headers).toBeUndefined()
      request.mockRestore()
    })

    it("classifies the Access login redirect as authentication without following it", async () => {
      let attempts = 0
      let loginPageHits = 0
      server.use(
        http.get("https://relay.example.com/plannings/cal.jsp", () => {
          attempts++
          return HttpResponse.redirect(
            "https://team.cloudflareaccess.com/cdn-cgi/access/login/relay.example.com",
            302,
          )
        }),
        http.get("https://team.cloudflareaccess.com/*", () => {
          loginPageHits++
          return HttpResponse.text("<html></html>")
        }),
      )

      const failure = await new IcalFetcher({ relay, withRetries: true })
        .fetch("https://calendar.example.edu/plannings/cal.jsp")
        .catch((error) => error)

      expect(failure).toMatchObject({ classification: "authentication" })
      expect(attempts).toBe(1)
      expect(loginPageHits).toBe(0)
    })

    it("keeps the service token out of a relayed failure", async () => {
      server.use(
        http.get("https://relay.example.com/plannings/cal.jsp", () =>
          HttpResponse.text("down", {
            status: 503,
            headers: { "set-cookie": "CF_Authorization=session-jwt" },
          }),
        ),
      )

      const failure = await new IcalFetcher({ relay })
        .fetch("https://calendar.example.edu/plannings/cal.jsp")
        .catch((error) => error)

      expect(failure).toMatchObject({ classification: "service_unavailable" })
      const cause = failure.originalCause
      expect(cause).toBeInstanceOf(AxiosError)
      expect(cause.config).toBeUndefined()
      expect(cause.request).toBeUndefined()
      expect(cause.cause).toBeUndefined()
      expect(cause.response?.request).toBeUndefined()
      expect(cause.response?.config.headers.toJSON()).toEqual({})
      const serialized = inspect(failure, { depth: null })
      expect(serialized).not.toContain("client-secret")
      expect(serialized).not.toContain("client-id.access")
      expect(serialized).not.toContain("session-jwt")
    })

    it.each([
      ["no origin", { ...relay, origin: "" }],
      ["a plain-http origin", { ...relay, origin: "http://relay.example.com" }],
      [
        "an origin with a path",
        { ...relay, origin: "https://relay.example.com/x" },
      ],
      [
        "an origin with user info",
        { ...relay, origin: "https://user@relay.example.com" },
      ],
      [
        "an origin with a query",
        { ...relay, origin: "https://relay.example.com/?x=1" },
      ],
      [
        "an origin with a fragment",
        { ...relay, origin: "https://relay.example.com/#x" },
      ],
      [
        "an origin whose path normalizes to /",
        { ...relay, origin: "https://relay.example.com/." },
      ],
      ["no client id", { ...relay, clientId: "" }],
      ["no client secret", { ...relay, clientSecret: "" }],
    ])(
      "keeps the proxy path when the relay has %s",
      async (_, unconfigured) => {
        await jest.isolateModulesAsync(async () => {
          jest.doMock("config/constants", () => ({
            ...jest.requireActual("config/constants"),
            PROXY_URL: "http://proxy.example.com:3128",
          }))
          const { IcalFetcher: IsolatedFetcher } = await import(
            "modules/fetch/fetchers/ical-fetcher"
          )
          const isolatedAxios = (await import("axios")).default
          const request = jest
            .spyOn(isolatedAxios, "request")
            .mockResolvedValue({ data: validIcal })
          const url = "https://calendar.example.edu/plannings/cal.jsp"

          await new IsolatedFetcher({
            useProxy: true,
            relay: unconfigured,
          }).fetch(url)

          expect(request.mock.calls[0][0]).toMatchObject({ url })
          expect(request.mock.calls[0][0].httpsAgent).toBeDefined()
          expect(request.mock.calls[0][0].headers).toBeUndefined()
        })
      },
    )
  })
})
