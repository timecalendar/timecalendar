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
import adeExportWindowRenamer from "modules/fetch/renamers/ade-export-window-renamer"
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

        jest.useFakeTimers({
          now: new Date("2026-08-25T12:00:00.000Z"),
        })
        const url =
          "https://google.com/jsp/custom/modules/plannings/anonymous_cal.jsp?calType=ical&crazy=true&nbWeeks=4"
        const school = "rouen"

        const events = await fetchService.fetchEvents(
          { url, customData: null },
          school,
        )

        expect(events.length).toBe(1)
        expect(icalFetcher.fetch).toHaveBeenCalledWith(
          "https://bing.com/jsp/custom/modules/plannings/anonymous_cal.jsp?calType=ical&crazy=true&firstDate=2025-08-25&lastDate=2027-08-25",
          {},
        )
        jest.useRealTimers()
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

      it("applies only the generic strategy when it is selected explicitly", async () => {
        initService([fetcherCalendarEventFactory.build()])
        const url = "https://google.com/search?crazy=true"

        await fetchService.fetchEvents({ url, customData: null }, "generic")

        expect(icalFetcher.fetch).toHaveBeenCalledWith(url, {})
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

    it("over-matches a suffix-planted host, which is the safe direction", () => {
      // `match` is a substring test for every strategy in the repo, not just
      // this one, so a host that merely contains the domain resolves to Lyon 1.
      // Left as-is deliberately: the only consequence is syncing that host less
      // often. Under-matching would be the dangerous direction, because it is
      // what would break the once-per-hour promise we made to Lyon 1.
      expect(
        resolve(
          lyon1Url.replace("univ-lyon1.fr", "univ-lyon1.fr.example.com"),
          null,
        ),
      ).toBe(60)
    })
  })

  describe("url transformation with the real strategy list", () => {
    // Registering univlyon1 took Lyon 1 urls out of transformUrl's
    // "matched nothing -> apply every strategy's renamers" fallback. These two
    // pin the consequence, which is otherwise invisible: `projectId` is now
    // left as the user's export url carries it, instead of being rewritten to
    // univstetienne's id 3.
    const service = new FetchService(schoolStrategies)
    const adeUrl = (host: string, dateWindow = "nbWeeks=4") =>
      `https://adelb.${host}/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=12345&projectId=-1&calType=ical&${dateWindow}`

    const fetchWith = async (
      url: string,
      school: string | null = null,
    ): Promise<string> => {
      icalFetcher.fetch.mockImplementationOnce(() =>
        Promise.resolve([fetcherCalendarEventFactory.build()]),
      )
      await service.fetchEvents({ url, customData: null }, school)
      const calls = icalFetcher.fetch.mock.calls as unknown as [string][]
      return calls[calls.length - 1][0]
    }

    it("keeps a Lyon 1 url's own projectId", async () => {
      await fetchWith(adeUrl("univ-lyon1.fr"))

      expect(icalFetcher.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("&projectId=-1&"),
        {},
      )
    })

    it("still rewrites projectId for a url matching no strategy", async () => {
      // The pre-existing fallback, unchanged by this strategy — kept here so
      // whoever adds the next strategy sees what registering one turns off.
      await fetchWith(adeUrl("unknown-school.example.com"))

      expect(icalFetcher.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining("&projectId=3&"),
        {},
      )
    })

    describe("bounded ADE export windows", () => {
      beforeEach(() => {
        jest.useFakeTimers({
          now: new Date("2026-08-25T12:00:00.000Z"),
        })
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      const expectBoundedWindow = (url: string) => {
        const parsedUrl = new URL(url)
        expect(parsedUrl.searchParams.get("firstDate")).toBe("2025-08-25")
        expect(parsedUrl.searchParams.get("lastDate")).toBe("2027-08-25")
        expect(parsedUrl.searchParams.has("nbWeeks")).toBe(false)
      }

      it("normalizes an unmatched ADE url and applies generic only once", async () => {
        const rename = jest.spyOn(adeExportWindowRenamer, "rename")

        const transformedUrl = await fetchWith(
          adeUrl("unknown-school.example.com"),
        )

        expectBoundedWindow(transformedUrl)
        expect(rename).toHaveBeenCalledTimes(1)
      })

      it("preserves Bourgogne's generic-renamer opt-out", async () => {
        const originalUrl = adeUrl(
          "u-bourgogne.fr",
          "firstDate=2020-01-01&lastDate=2020-01-02",
        )

        expect(await fetchWith(originalUrl)).toBe(originalUrl)
      })

      it("leaves Savoie Mont Blanc's half-pair repair authoritative", async () => {
        const transformedUrl = await fetchWith(
          "https://ade6-usmb-ro.grenet.fr/jsp/custom/modules/plannings/direct_cal.jsp?resources=5934&projectId=1&calType=ical&login=iCalExport&password=secret&lastDate=2040-08-14",
        )
        const parsedUrl = new URL(transformedUrl)

        expect(parsedUrl.searchParams.get("firstDate")).toBe("2019-08-26")
        expect(parsedUrl.searchParams.get("lastDate")).toBe("2040-08-14")
      })

      it("normalizes St-Etienne dates before its project rewrite", async () => {
        const transformedUrl = await fetchWith(
          adeUrl(
            "univ-st-etienne.fr",
            "firstDate=2020-01-01&lastDate=2020-01-02",
          ),
        )

        expectBoundedWindow(transformedUrl)
        expect(new URL(transformedUrl).searchParams.get("projectId")).toBe("3")
      })

      it("normalizes Lyon 1 dates while retaining its exported project", async () => {
        const transformedUrl = await fetchWith(
          adeUrl("univ-lyon1.fr", "firstDate=2020-01-01&lastDate=2020-01-02"),
        )

        expectBoundedWindow(transformedUrl)
        expect(new URL(transformedUrl).searchParams.get("projectId")).toBe("-1")
      })
    })
  })
})
