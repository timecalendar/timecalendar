const icalFetcher: {
  fetch: jest.Mock<Promise<FetcherCalendarEvent[]>, []>
} = {
  fetch: jest.fn(() => Promise.resolve([])),
}

jest.mock("modules/fetch/fetchers/ical-fetcher", () => {
  return {
    IcalFetcher: jest
      .fn()
      .mockImplementation(() => ({ fetch: icalFetcher.fetch })),
  }
})

import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import {
  EventType,
  FetcherCalendarEvent,
} from "modules/fetch/models/event.model"
import { ReplaceUrlRenamer } from "modules/fetch/renamers/replace-url-renamer"
import schoolStrategies from "modules/fetch/schools/schools"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

describe("FetchService", () => {
  const pipe = jest.fn((event) => event)
  let strategies: SchoolStrategy[]
  let fetchService: FetchService

  const crazyschoolFetcher = jest.fn(() => Promise.resolve([]))

  const initService = (events: FetcherCalendarEvent[]) => {
    icalFetcher.fetch.mockImplementationOnce(() => Promise.resolve(events))
    strategies = [
      new SchoolStrategy({
        school: "rouen",
        urlRenamers: [
          new ReplaceUrlRenamer("https://google.com/", "https://bing.com/"),
          new ReplaceUrlRenamer("&format=1", ""),
        ],
        eventPipes: [pipe],
      }),
      new SchoolStrategy({
        school: "crazyschool",
        urlRenamers: [new ReplaceUrlRenamer("&crazy=true", "&crazy=false")],
        fetcher: { fetch: crazyschoolFetcher },
      }),
    ]
    fetchService = new FetchService(strategies)
  }

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

      expect(icalFetcher.fetch).toHaveBeenCalled()
      expect(pipe).toHaveBeenCalled()
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

    it("should use the correct strategy", async () => {
      initService([fetcherCalendarEventFactory.build()])

      const url = "https://google.com/search?export=json&format=1"
      const school = "crazyschool"

      await fetchService.fetchEvents({ url, customData: null }, school)

      expect(crazyschoolFetcher).toHaveBeenCalledWith(
        "https://google.com/search?export=json&format=1",
        {},
      )
    })

    describe("rename url", () => {
      it("uses only the generic and school strategy if one exists", async () => {
        initService([fetcherCalendarEventFactory.build()])

        const url = "https://google.com/search?export=json&crazy=true&nbWeeks=4"
        const school = "rouen"

        const events = await fetchService.fetchEvents(
          { url, customData: null },
          school,
        )

        expect(events.length).toBe(1)
        expect(icalFetcher.fetch).toHaveBeenCalledWith(
          "https://bing.com/search?export=json&crazy=true&firstDate=2000-01-01&lastDate=2038-01-01",
          {},
        )
      })

      it("uses only the school strategy if inheritGenericUrlRenamers is false", async () => {
        strategies = [
          new SchoolStrategy({
            school: "oneschool",
            inheritGenericUrlRenamers: false,
          }),
        ]
        fetchService = new FetchService(strategies)

        const url = "https://google.com/search?export=json&nbWeeks=4"
        const school = "oneschool"

        await fetchService.fetchEvents({ url, customData: null }, school)

        expect(icalFetcher.fetch).toHaveBeenCalledWith(
          "https://google.com/search?export=json&nbWeeks=4",
          {},
        )
      })

      it("uses all strategies if no school is provided", async () => {
        initService([fetcherCalendarEventFactory.build()])

        const url = "https://google.com/search?export=json&crazy=true"
        const school = null

        const events = await fetchService.fetchEvents(
          { url, customData: null },
          school,
        )

        expect(events.length).toBe(1)
        expect(icalFetcher.fetch).toHaveBeenCalledWith(
          "https://bing.com/search?export=json&crazy=false",
          {},
        )
      })

      it("uses all strategies if no school strategy is found", async () => {
        initService([fetcherCalendarEventFactory.build()])

        const url = "https://google.com/search?export=json&crazy=true"
        const school = "unknown"

        const events = await fetchService.fetchEvents(
          { url, customData: null },
          school,
        )

        expect(events.length).toBe(1)
        expect(icalFetcher.fetch).toHaveBeenCalledWith(
          "https://bing.com/search?export=json&crazy=false",
          {},
        )
      })
    })
  })

  describe("getMinSyncIntervalMinutes", () => {
    // The real strategy list: this is what proves Lyon 1 is recognised.
    const service = new FetchService(schoolStrategies)
    const lyon1Url =
      "https://adelb.univ-lyon1.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=12345&projectId=6&calType=ical"

    const resolve = (url: string, school: string | null) =>
      service.getMinSyncIntervalMinutes({ url, customData: null }, school)

    it("returns 60 minutes for a Lyon 1 url", () => {
      expect(resolve(lyon1Url, null)).toBe(60)
    })

    it("returns 60 minutes for the Lyon 1 school code", () => {
      expect(resolve("https://calendar.example.com/ical", "univlyon1")).toBe(60)
    })

    it("returns the default for another calendar", () => {
      expect(resolve("https://calendar.example.com/ical", null)).toBe(30)
    })

    it("returns the default for a url that only resembles a Lyon 1 one", () => {
      expect(
        resolve(lyon1Url.replace("univ-lyon1.fr", "univ-lyon2.fr"), null),
      ).toBe(30)
    })
  })
})
