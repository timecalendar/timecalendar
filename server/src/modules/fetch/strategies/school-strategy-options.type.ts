import { Fetcher } from "modules/fetch/fetchers/fetcher"
import { CalendarSource } from "modules/fetch/models/calendar-source"
import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"
import { UrlRenamer } from "modules/fetch/renamers/url-renamer"

export type MatcherFn = (data: { source: CalendarSource }) => boolean

export interface SchoolStrategyOptions {
  /**
   * School code
   */
  school: string

  /**
   * URL renamers to apply to the URL.
   */
  urlRenamers: (
    | UrlRenamer
    | { renamer: UrlRenamer; onlyThisSchool?: boolean }
  )[]

  /**
   * If true, the strategy will inherit the generic URL renamers.
   */
  inheritGenericUrlRenamers?: boolean

  /**
   * Fetcher to use for this strategy.
   */
  fetcher: Fetcher

  /**
   * Match the source to the strategy.
   * If not provided, the strategy will be used only when the user has manually selected
   * the correct school
   *
   * If a string or a RegExp is provided, it will be matched against the URL.
   */
  match?: (MatcherFn | string | RegExp)[]

  /**
   * Transformers to apply to the events.
   */
  eventPipes: EventTransformPipe[]
}
