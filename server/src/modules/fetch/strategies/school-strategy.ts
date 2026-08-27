import { DEFAULT_MIN_SYNC_INTERVAL_MINUTES } from "modules/fetch/constants"
import { IcalFetcher } from "modules/fetch/fetchers/ical-fetcher"
import {
  CalendarCustomData,
  CalendarSource,
} from "modules/fetch/models/calendar-source"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { FetchContext } from "modules/fetch/models/fetch-context"
import { defaultPipes } from "modules/fetch/pipes/pipes"
import { SchoolStrategyOptions } from "modules/fetch/strategies/school-strategy-options.type"

const defaultOptions: SchoolStrategyOptions = {
  school: "generic",
  urlRenamers: [],
  inheritGenericUrlRenamers: true,
  fetcher: new IcalFetcher(),
  eventPipes: [],
  minSyncIntervalMinutes: DEFAULT_MIN_SYNC_INTERVAL_MINUTES,
}

export class SchoolStrategy {
  private _options: SchoolStrategyOptions

  public get options() {
    return this._options
  }

  constructor(options: Partial<SchoolStrategyOptions>) {
    this._options = {
      ...defaultOptions,
      ...options,
    }
  }

  isMatchingCalendarSource(
    school: string | null,
    calendarSource: CalendarSource,
  ) {
    if (this.options.school === school) {
      return true
    }

    if (this.options.match !== undefined) {
      return this.options.match.some((matcher) => {
        if (typeof matcher === "string") {
          return calendarSource.url.includes(matcher)
        }
        if (typeof matcher === "function") {
          return matcher({ source: calendarSource })
        }
        if (matcher instanceof RegExp) {
          return matcher.test(calendarSource.url)
        }

        throw new Error("Invalid matcher")
      })
    }

    return false
  }

  transformUrl(url: string, school: string | null) {
    return this.options.urlRenamers.reduce((acc, renamer) => {
      // Extract renamer object
      const onlyThisSchool =
        "onlyThisSchool" in renamer && renamer.onlyThisSchool
      const renamerObj = "renamer" in renamer ? renamer.renamer : renamer

      return onlyThisSchool && school !== this.options.school
        ? acc
        : renamerObj.rename(acc, school)
    }, url)
  }

  transformEvents(events: FetcherCalendarEvent[]) {
    const pipes = [...defaultPipes, ...this.options.eventPipes]

    return events.map((event) => pipes.reduce((acc, pipe) => pipe(acc), event))
  }

  fetchEvents(
    url: string,
    data: CalendarCustomData | null,
    context: FetchContext = {},
  ) {
    return this.options.fetcher.fetch(url, data ?? {}, context)
  }
}
