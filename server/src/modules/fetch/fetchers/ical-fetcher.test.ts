import { readFileSync } from "fs"
import { join } from "path"
import { setupMsw } from "test-utils/setup-msw"
import { http, HttpResponse } from "msw"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import { BadRequestException } from "@nestjs/common"

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
})
