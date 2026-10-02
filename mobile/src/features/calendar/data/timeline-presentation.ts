import type { ChecklistProgress } from "@/features/event-checklists"

import { dayKey, minuteOfDayInZone } from "./day-key"
import {
  type EventAppearance,
  type EventAppearanceScheme,
  resolveEventAppearance,
} from "./event-color"
import { displayEventTitle } from "./event-title"
import { layoutOverlaps, overlapIdentityKey } from "./overlap-layout"
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

export interface TimelineTileOptions {
  displayZone: string
  checklistProgress?: ReadonlyMap<string, TimelineChecklistProgressV1>
  localizedNoTitle?: string
  scheme?: EventAppearanceScheme
  increasedContrast?: boolean
}

/** Supported timed events as unplaced tiles, keyed by display-zone day. */
export function bucketTimedTiles(
  events: readonly CalendarEvent[],
  options: TimelineTileOptions,
): Map<string, TimedTileV1[]> {
  const tilesByDay = new Map<string, TimedTileV1[]>()
  const displayZone = options.displayZone
  for (const event of events) {
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
        options.localizedNoTitle ?? "(No title)",
      ),
      location: supported.location,
      appearance: resolveEventAppearance({
        color: supported.color,
        scheme: options.scheme ?? "light",
        increasedContrast: options.increasedContrast ?? false,
      }),
      startsAt: new Date(supported.startsAt),
      endsAt: new Date(supported.endsAt),
      startMinute: minuteOfDayInZone(supported.startsAt, displayZone),
      endMinute: endMinute(supported, displayZone),
      checklist: options.checklistProgress?.get(supported.identity.uid),
      column: 0,
      columns: 1,
      startX: 0,
      endX: 1,
    }
    const current = tilesByDay.get(key)
    if (current === undefined) tilesByDay.set(key, [tile])
    else current.push(tile)
  }
  return tilesByDay
}

/** Placed, chronologically sorted tiles for one column's day. */
export function timelineColumnTiles(
  tilesByDay: ReadonlyMap<string, readonly TimedTileV1[]>,
  dayKey: string,
): TimedTileV1[] {
  return placeDayTiles(tilesByDay.get(dayKey) ?? []).sort(compareTiles)
}
