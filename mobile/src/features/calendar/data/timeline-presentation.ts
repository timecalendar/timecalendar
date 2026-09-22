import type { ChecklistProgress } from "@/features/event-checklists"

import { dayKey, minuteOfDayInZone } from "./day-key"
import {
  type EventAppearance,
  type EventAppearanceScheme,
  resolveEventAppearance,
} from "./event-color"
import { displayEventTitle } from "./event-title"
import { layoutOverlaps, overlapIdentityKey } from "./overlap-layout"
import type { CalendarThreePageRangeV1 } from "./range-plan"
import { classifyTimedEventSupport } from "./timed-support"
import type { CalendarEvent, CalendarEventIdentityV1 } from "./types"

export type TimelineChecklistProgressV1 = ChecklistProgress

export interface TimedTileV1 {
  version: 1
  identity: CalendarEventIdentityV1
  key: string
  shape: "point" | "interval"
  title: string
  location: string | undefined
  appearance: EventAppearance
  startsAt: Date
  endsAt: Date
  startMinute: number
  endMinute: number
  checklist: TimelineChecklistProgressV1 | undefined
  column: number
  columns: number
  startX: number
  endX: number
}

export interface CalendarTimelineColumnV1 {
  version: 1
  key: string
  date: Date
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6
  isWeekend: boolean
  tiles: readonly TimedTileV1[]
}

export interface CalendarTimelinePageV1 {
  version: 1
  direction: -1 | 0 | 1
  key: string
  columns: readonly CalendarTimelineColumnV1[]
}

export interface CalendarTimelinePresentationV1 {
  version: 1
  generation: number
  rangeKey: string
  pages: readonly [
    CalendarTimelinePageV1,
    CalendarTimelinePageV1,
    CalendarTimelinePageV1,
  ]
}

function endMinute(
  event: Extract<CalendarEvent, { kind: "timed" }>,
  zone: string,
) {
  return dayKey(event.endsAt, zone) === dayKey(event.startsAt, zone)
    ? minuteOfDayInZone(event.endsAt, zone)
    : 24 * 60
}

function compareOrdinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareTiles(left: TimedTileV1, right: TimedTileV1): number {
  const byStart = left.startsAt.getTime() - right.startsAt.getTime()
  if (byStart !== 0) return byStart
  const byEnd = left.endsAt.getTime() - right.endsAt.getTime()
  if (byEnd !== 0) return byEnd
  const bySource = compareOrdinal(left.identity.source, right.identity.source)
  return bySource !== 0
    ? bySource
    : compareOrdinal(left.identity.uid, right.identity.uid)
}

function placeDayTiles(tiles: readonly TimedTileV1[]): TimedTileV1[] {
  const identities = new Set<string>()
  for (const tile of tiles) {
    const key = overlapIdentityKey(tile.identity)
    if (identities.has(key)) {
      throw new RangeError("Timeline identities must be unique within a day")
    }
    identities.add(key)
  }
  const placements = layoutOverlaps(
    tiles.filter((tile) => tile.shape === "interval"),
  )
  return tiles.map((tile) => {
    const placement = placements.get(overlapIdentityKey(tile.identity))
    return {
      ...tile,
      column: placement?.column ?? 0,
      columns: placement?.columns ?? 1,
      startX: placement?.startX ?? 0,
      endX: placement?.endX ?? 1,
    }
  })
}

function freezePresentation(
  presentation: CalendarTimelinePresentationV1,
): CalendarTimelinePresentationV1 {
  for (const page of presentation.pages) {
    for (const column of page.columns) {
      for (const tile of column.tiles) {
        Object.freeze(tile.identity)
        Object.freeze(tile.appearance)
        if (tile.checklist !== undefined) Object.freeze(tile.checklist)
        Object.freeze(tile)
      }
      Object.freeze(column.tiles)
      Object.freeze(column)
    }
    Object.freeze(page.columns)
    Object.freeze(page)
  }
  Object.freeze(presentation.pages)
  return Object.freeze(presentation)
}

export function buildCalendarTimelinePresentation(input: {
  range: CalendarThreePageRangeV1
  generation: number
  events: readonly CalendarEvent[]
  checklistProgress?: ReadonlyMap<string, TimelineChecklistProgressV1>
  localizedNoTitle?: string
  scheme?: EventAppearanceScheme
  increasedContrast?: boolean
}): CalendarTimelinePresentationV1 {
  const tilesByDay = new Map<string, TimedTileV1[]>()
  const displayZone = input.range.displayZone
  for (const event of input.events) {
    const support = classifyTimedEventSupport(event, displayZone)
    if (!support.supported) continue
    const supported = support.event
    const key = dayKey(supported.startsAt, displayZone)
    const tile: TimedTileV1 = {
      version: 1,
      identity: { ...supported.identity },
      key: `${supported.identity.source}:${supported.identity.uid}`,
      shape: support.shape,
      title: displayEventTitle(
        supported.title,
        input.localizedNoTitle ?? "(No title)",
      ),
      location: supported.location,
      appearance: resolveEventAppearance({
        color: supported.color,
        scheme: input.scheme ?? "light",
        increasedContrast: input.increasedContrast ?? false,
      }),
      startsAt: new Date(supported.startsAt),
      endsAt: new Date(supported.endsAt),
      startMinute: minuteOfDayInZone(supported.startsAt, displayZone),
      endMinute: endMinute(supported, displayZone),
      checklist: input.checklistProgress?.get(supported.identity.uid),
      column: 0,
      columns: 1,
      startX: 0,
      endX: 1,
    }
    const current = tilesByDay.get(key)
    if (current === undefined) tilesByDay.set(key, [tile])
    else current.push(tile)
  }

  const pages = input.range.pages.map(
    (page): CalendarTimelinePageV1 => ({
      version: 1,
      direction: page.direction,
      key: page.key,
      columns: page.columns.map(
        (column): CalendarTimelineColumnV1 => ({
          version: 1,
          key: column.key,
          date: new Date(column.date),
          weekday: column.weekday,
          isWeekend: column.isWeekend,
          tiles: placeDayTiles(tilesByDay.get(column.key) ?? []).sort(
            compareTiles,
          ),
        }),
      ),
    }),
  ) as unknown as CalendarTimelinePresentationV1["pages"]

  return freezePresentation({
    version: 1,
    generation: input.generation,
    rangeKey: input.range.key,
    pages,
  })
}

export function timelinePresentationUids(
  presentation: CalendarTimelinePresentationV1,
): readonly string[] {
  return [
    ...new Set(
      presentation.pages.flatMap((page) =>
        page.columns.flatMap((column) =>
          column.tiles.map((tile) => tile.identity.uid),
        ),
      ),
    ),
  ].sort()
}
