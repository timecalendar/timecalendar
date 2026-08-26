import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { FetchService } from "modules/fetch/services/fetch.service"
import univrennes1Strategy from "./univrennes1-strategy"

describe("univrennes1Strategy", () => {
  it("matches the current Rennes planning host", () => {
    const service = new FetchService([univrennes1Strategy])
    const fetch = jest
      .spyOn(univrennes1Strategy.options.fetcher, "fetch")
      .mockResolvedValue([fetcherCalendarEventFactory.build()])

    return service
      .fetchEvents(
        {
          url: "https://planning.univ-rennes.fr/jsp/custom/modules/plannings/anonymous_cal.jsp?resources=safe&calType=ical",
          customData: null,
        },
        null,
      )
      .then(() => expect(fetch).toHaveBeenCalledTimes(1))
  })
})
