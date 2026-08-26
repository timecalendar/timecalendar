import { readFileSync } from "fs"
import { join } from "path"
import { setupMsw } from "test-utils/setup-msw"
import { http, HttpResponse } from "msw"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { CalendarFetchError } from "modules/fetch/models/calendar-fetch-outcome"

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
      new CalendarFetchError("http_5xx"),
    )
  })

  it("should retry the request", async () => {
    server.use(
      http.get("https://example.com", function* () {
        yield new HttpResponse(null, { status: 500 })
        yield new HttpResponse(
          readFileSync(join(__dirname, "__tests__/ical.ics"), "utf-8"),
        )
      }),
    )

    const fetcher = new IcalFetcher({ withRetries: true })
    const events = await fetcher.fetch("https://example.com")

    expect(events).toHaveLength(1)
  })

  it.each([
    ["", "text/calendar", "empty_body"],
    ["<html>sign in</html>", "text/html", "html_response"],
    ["not a calendar", "text/plain", "invalid_content"],
    ["BEGIN:VCALENDAR\nEND:VCALENDAR", "text/calendar", "empty_calendar"],
  ] as const)(
    "returns the bounded %s outcome",
    async (body, contentType, kind) => {
      server.use(
        http.get("https://example.com", () =>
          HttpResponse.text(body, { headers: { "content-type": contentType } }),
        ),
      )

      await expect(
        new IcalFetcher().fetch("https://example.com"),
      ).rejects.toThrow(new CalendarFetchError(kind))
    },
  )
})
