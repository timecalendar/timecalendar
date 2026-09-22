import { overlapIdentityKey } from "./overlap-layout"
import type {
  CalendarTimelinePageV1,
  TimedTileV1,
} from "./timeline-presentation"
import type { CalendarEventIdentityV1 } from "./types"

export interface CalendarAccessibilityEntryV1 {
  version: 1
  identity: CalendarEventIdentityV1
  key: string
  dateKey: string
  startsAt: Date
  endsAt: Date
  tile: TimedTileV1
}

export function compareCalendarAccessibilityOrdinal(
  left: string,
  right: string,
): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function compareEntries(
  left: CalendarAccessibilityEntryV1,
  right: CalendarAccessibilityEntryV1,
): number {
  const byDate = compareCalendarAccessibilityOrdinal(
    left.dateKey,
    right.dateKey,
  )
  if (byDate !== 0) return byDate
  const byStart = left.startsAt.getTime() - right.startsAt.getTime()
  if (byStart !== 0) return byStart
  const byEnd = left.endsAt.getTime() - right.endsAt.getTime()
  if (byEnd !== 0) return byEnd
  const bySource = compareCalendarAccessibilityOrdinal(
    left.identity.source,
    right.identity.source,
  )
  return bySource !== 0
    ? bySource
    : compareCalendarAccessibilityOrdinal(left.identity.uid, right.identity.uid)
}

export function projectCalendarAccessibilityEntries(
  committedPage: CalendarTimelinePageV1,
): readonly CalendarAccessibilityEntryV1[] {
  if (committedPage.direction !== 0) {
    throw new RangeError("Accessibility entries require the committed page")
  }

  const identities = new Set<string>()
  const entries = committedPage.columns.flatMap((column) =>
    column.tiles.map((tile): CalendarAccessibilityEntryV1 => {
      const identityKey = overlapIdentityKey(tile.identity)
      if (identities.has(identityKey)) {
        throw new RangeError(
          "Accessibility identities must be unique within the committed page",
        )
      }
      identities.add(identityKey)
      return {
        version: 1,
        identity: tile.identity,
        key: tile.key,
        dateKey: column.key,
        startsAt: tile.startsAt,
        endsAt: tile.endsAt,
        tile,
      }
    }),
  )

  entries.sort(compareEntries)
  for (const entry of entries) Object.freeze(entry)
  return Object.freeze(entries)
}
