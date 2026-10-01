import type { TFunction } from "i18next"

import { checklistProgressLabel } from "@/features/event-checklists"

import { projectCalendarAccessibilityEntries } from "./accessibility-projection"
import type { PageStatus } from "./calendar-window-store"
import type { EventAppearanceScheme } from "./event-color"
import {
  type AppLocale,
  formatDayHeaderParts,
  formatNarrowWeekday,
  formatTimeRange,
} from "./format"
import { createLruCache, type LruCache } from "./lru-cache"
import {
  pageColumns,
  type PageIndex,
  type PageKey,
  pageKey,
  type PageSpace,
} from "./page-index"
import {
  bucketTimedTiles,
  type CalendarTimelinePageV1,
  type TimedTileV1,
  type TimelineChecklistProgressV1,
  timelineColumnTiles,
} from "./timeline-presentation"
import type { CalendarEvent } from "./types"

export const PAGE_PRESENTATION_CACHE_SIZE = 16

export interface PageTileV1 extends TimedTileV1 {
  timeLabel: string
  accessibilityLabel: string
  /** Position in the page's chronological accessibility order. */
  accessibilityOrder: number
}

export interface DayHeaderLabelsV1 {
  weekday: string
  dayOfMonth: string
  narrowWeekday: string
  /** The date header's accessibility label, without the "today" suffix. */
  label: string
}

export interface PageColumnV1 {
  version: 1
  key: string
  date: Date
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
  isWeekend: boolean
  header: DayHeaderLabelsV1
  tiles: readonly PageTileV1[]
}

/** Everything a page renders that does not depend on zoom, built once and frozen. */
export interface PagePresentationV1 {
  version: 1
  pageKey: PageKey
  status: PageStatus
  columns: readonly PageColumnV1[]
  accessibilityOrder: readonly PageTileV1[]
}

export interface PagePresentationEnvironment {
  locale: AppLocale
  displayZone: string
  showWeekends: boolean
  scheme: EventAppearanceScheme
  increasedContrast: boolean
  localizedNoTitle: string
  t: TFunction
}

interface PageFormatters {
  header(date: Date, key: string): DayHeaderLabelsV1
  timeRange(startsAt: Date, endsAt: Date): string
}

const FORMATTER_MEMO_SIZE = 512
const formatterCache = createLruCache<string, PageFormatters>(8)

function pageFormatters(locale: AppLocale, zone: string): PageFormatters {
  return formatterCache.getOrCreate(`${locale}|${zone}`, () => {
    const headers = createLruCache<string, DayHeaderLabelsV1>(
      FORMATTER_MEMO_SIZE,
    )
    const times = createLruCache<string, string>(FORMATTER_MEMO_SIZE)
    return {
      header: (date, key) =>
        headers.getOrCreate(key, () => {
          const parts = formatDayHeaderParts(date, locale, zone)
          return Object.freeze({
            ...parts,
            narrowWeekday: formatNarrowWeekday(date, locale, zone),
            label: `${parts.weekday} ${parts.dayOfMonth}`,
          })
        }),
      timeRange: (startsAt, endsAt) =>
        times.getOrCreate(`${startsAt.getTime()}:${endsAt.getTime()}`, () =>
          formatTimeRange(startsAt, endsAt, locale, zone),
        ),
    }
  })
}

function tileAccessibilityLabel(
  tile: TimedTileV1,
  time: string,
  t: TFunction,
): string {
  const progress = checklistProgressLabel(t, tile.checklist)
  return t(
    progress === undefined
      ? "calendar.event.label"
      : "calendar.event.labelWithProgress",
    {
      title: tile.title,
      time,
      location: tile.location ?? "",
      progress,
    },
  )
}

export function buildPagePresentation(input: {
  space: PageSpace
  index: PageIndex
  status: PageStatus
  events: readonly CalendarEvent[]
  checklist: ReadonlyMap<string, TimelineChecklistProgressV1>
  environment: PagePresentationEnvironment
}): PagePresentationV1 {
  const { environment } = input
  const formatters = pageFormatters(environment.locale, environment.displayZone)
  const columns = pageColumns(
    input.space,
    input.index,
    environment.displayZone,
    environment.showWeekends,
  )
  const tilesByDay =
    input.status === "ready"
      ? bucketTimedTiles(input.events, {
          displayZone: environment.displayZone,
          checklistProgress: input.checklist,
          localizedNoTitle: environment.localizedNoTitle,
          scheme: environment.scheme,
          increasedContrast: environment.increasedContrast,
        })
      : new Map<string, TimedTileV1[]>()
  const key = pageKey(input.space, input.index)
  const placed: CalendarTimelinePageV1 = {
    version: 1,
    direction: 0,
    key,
    columns: columns.map((column) => ({
      version: 1,
      key: column.key,
      date: column.date,
      weekday: column.weekday,
      isWeekend: column.isWeekend,
      tiles: timelineColumnTiles(tilesByDay, column.key),
    })),
  }
  const order = new Map(
    projectCalendarAccessibilityEntries(placed).map((entry, position) => [
      entry.tile,
      position,
    ]),
  )
  const accessibilityOrder: PageTileV1[] = []
  const pageColumnsV1 = placed.columns.map((column): PageColumnV1 => {
    const tiles = column.tiles.map((tile): PageTileV1 => {
      const timeLabel = formatters.timeRange(tile.startsAt, tile.endsAt)
      const pageTile: PageTileV1 = Object.freeze({
        ...tile,
        identity: Object.freeze(tile.identity),
        appearance: Object.freeze(tile.appearance),
        checklist:
          tile.checklist === undefined
            ? undefined
            : Object.freeze(tile.checklist),
        timeLabel,
        accessibilityLabel: tileAccessibilityLabel(
          tile,
          timeLabel,
          environment.t,
        ),
        accessibilityOrder: order.get(tile) as number,
      })
      accessibilityOrder[pageTile.accessibilityOrder] = pageTile
      return pageTile
    })
    return Object.freeze({
      version: 1,
      key: column.key,
      date: column.date,
      weekday: column.weekday,
      isWeekend: column.isWeekend,
      header: formatters.header(column.date, column.key),
      tiles: Object.freeze(tiles),
    })
  })
  return Object.freeze({
    version: 1,
    pageKey: key,
    status: input.status,
    columns: Object.freeze(pageColumnsV1),
    accessibilityOrder: Object.freeze(accessibilityOrder),
  })
}

/**
 * The cache identity of a page presentation: the page, its rows' revision,
 * the filter revision and every environment value the labels depend on.
 */
export function pagePresentationCacheKey(input: {
  pageKey: PageKey
  status: PageStatus
  rowsRevision: number
  filterRevision: number
  environment: Omit<PagePresentationEnvironment, "t">
}): string {
  const { environment } = input
  return [
    input.pageKey,
    input.status,
    input.rowsRevision,
    input.filterRevision,
    environment.locale,
    environment.displayZone,
    environment.showWeekends ? "7" : "5",
    environment.scheme,
    environment.increasedContrast ? "hc" : "nc",
    environment.localizedNoTitle,
  ].join("|")
}

export type PagePresentationCache = LruCache<string, PagePresentationV1>

export function createPagePresentationCache(
  capacity: number = PAGE_PRESENTATION_CACHE_SIZE,
): PagePresentationCache {
  return createLruCache(capacity)
}
