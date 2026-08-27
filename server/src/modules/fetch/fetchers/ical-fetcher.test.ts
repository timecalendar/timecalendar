import { readFileSync } from "fs"
import { join } from "path"
import { setupMsw } from "test-utils/setup-msw"
import { delay, http, HttpResponse } from "msw"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { BadRequestException } from "@nestjs/common"
import { CalendarSyncAbortError } from "modules/calendar-sync/models/calendar-sync-context"
import { CustomError } from "modules/shared/errors/custom-error"

const server = setupMsw()

describe("IcalFetcher", () => {
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
        yield new HttpResponse(null, { status: 500 })
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
