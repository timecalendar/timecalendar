import { readFileSync } from "fs"
import { join } from "path"
import { NestExpressApplication } from "@nestjs/platform-express"
import axios from "axios"
import { FetchModule } from "modules/fetch/fetch.module"
import { FetchService } from "modules/fetch/services/fetch.service"
import createTestApp from "test-utils/create-test-app"

const axiosMock = axios as unknown as jest.Mock

describe("FetchService", () => {
  let fetchService: FetchService
  let app: NestExpressApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [FetchModule] })
    fetchService = app.get(FetchService)
  })

  it("should use the default strategy from FetchModule", async () => {
    const ical = readFileSync(
      join(__dirname, "../parsers/__tests__/ical.ics"),
      "utf-8",
    )

    axiosMock.mockResolvedValueOnce({ data: ical })

    const events = await fetchService.fetchEvents(
      { url: "https://google.com", customData: null },
      "generic",
    )

    expect(events.length).toBe(1)
    expect(events[0].title).toBe("Cours")
  })
})
