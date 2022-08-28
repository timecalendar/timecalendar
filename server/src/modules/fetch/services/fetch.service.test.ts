import { readFileSync } from "fs"
import { join } from "path"
import { NestExpressApplication } from "@nestjs/platform-express"
import axios from "axios"
import { FetchModule } from "modules/fetch/fetch.module"
import {
  EventType,
  FetcherCalendarEvent,
} from "modules/fetch/models/event.model"
import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"
import { clearNestTestApp } from "test-utils/create-nest-app"
import createTestApp from "test-utils/create-test-app"
import { FetchService } from "modules/fetch/services/fetch.service"

const axiosMock = axios as unknown as jest.Mock

describe("FetchService", () => {
  let fetch: jest.Mock<Promise<FetcherCalendarEvent[]>, []>

  const pipe = jest.fn((event) => event)

  let strategies: SchoolStrategy[]

  let fetchService: FetchService

  const initService = (events: FetcherCalendarEvent[]) => {
    fetch = jest.fn(() => Promise.resolve(events))
    strategies = [
      new SchoolStrategy({
        school: "rouen",
        urlRenamers: [
          new ReplaceUrlRenamer("https://google.com/", "https://bing.com/"),
          new ReplaceUrlRenamer("&format=1", ""),
        ],
        fetcher: {
          fetch,
        },
        eventPipes: [pipe],
      }),
    ]
    fetchService = new FetchService(strategies)
  }

  describe("transformUrl", () => {
    beforeEach(() => {
      initService([])
    })

    it("should transform the url using all strategies", () => {
      const url = fetchService.transformUrl(
        "https://google.com/search?export=json&format=1",
        "rouen",
      )

      expect(url).toBe("https://bing.com/search?export=json")
    })
  })

  describe("fetchEvents", () => {
    it("should fetch events", async () => {
      initService([
        {
          uid: "EDC903E2-3B29-4E7A-B335-20CF153FEDDB",
          title: "Cours",
          allDay: false,
          start: new Date("2021-08-30T07:00:00.000Z"),
          end: new Date("2021-08-30T08:00:00.000Z"),
          description: "",
          location: "Paris",
          type: EventType.CLASS,
          teachers: [],
          tags: [],
          fields: {},
        },
      ])

      const url = "https://google.com/search?export=json&format=1"
      const school = "rouen"

      const events = await fetchService.fetchEvents(
        { url, customData: null },
        school,
      )

      expect(fetch).toBeCalled()
      expect(pipe).toBeCalled()
      expect(events.length).toBe(1)
    })

    it("should remove canceled events", async () => {
      initService([
        {
          uid: "1",
          title: "Cours",
          allDay: false,
          start: new Date("2021-08-30T07:00:00.000Z"),
          end: new Date("2021-08-30T08:00:00.000Z"),
          description: "",
          location: "Paris",
          type: EventType.CLASS,
          teachers: [],
          tags: [],
          fields: {},
        },
        {
          uid: "2",
          title: "Cours",
          allDay: false,
          start: new Date("2021-08-30T08:00:00.000Z"),
          end: new Date("2021-08-30T09:00:00.000Z"),
          description: "",
          location: "Paris",
          type: EventType.CLASS,
          teachers: [],
          tags: [],
          fields: {
            canceled: true,
          },
        },
      ])

      const url = "https://google.com/search?export=json&format=1"
      const school = "rouen"

      const events = await fetchService.fetchEvents(
        { url, customData: null },
        school,
      )

      expect(events.length).toBe(1)
      expect(events[0].uid).toBe("1")
    })

    describe("with FetchModule", () => {
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

      afterAll(() => clearNestTestApp(app))
    })
  })
})
