import { FetcherCalendarEvent } from "../models/event"
import { Fetcher } from "../fetchers/fetcher"
import { IcalFetcher } from "../fetchers/ical-fetcher"
import { CalendarCustomData } from "../models/calendar-custom-data"
import { EventTransformPipe } from "../pipes/event-transform-pipe"
import { defaultPipes } from "../pipes/pipes"
import { UrlRenamer } from "../renamers/url-renamer"

export interface SchoolStrategyOptions {
  school: string
  urlRenamers: (
    | UrlRenamer
    | { renamer: UrlRenamer; onlyThisSchool?: boolean }
  )[]
  fetcher: Fetcher
  eventPipes: EventTransformPipe[]
}

const defaultOptions: SchoolStrategyOptions = {
  school: "generic",
  urlRenamers: [],
  fetcher: new IcalFetcher(),
  eventPipes: [],
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

  transformUrl(url: string, school: string) {
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

  fetchEvents(url: string, data: CalendarCustomData) {
    return this.options.fetcher.fetch(url, data)
  }
}
