import { createHash } from "node:crypto"
import { CalendarLogV1 } from "modules/calendar-log/models/dto/calendar-log-v1.dto"
import { CalendarChangeGet } from "modules/calendar-log/models/dto/calendar-change-get.dto"
import { CalendarLogEventGet } from "modules/calendar-log/models/dto/calendar-log-event-get.dto"
import { CalendarChangedItem } from "modules/calendar-log/models/dto/calendar-changed-item.dto"

export const MAX_FRAGMENT_BYTES = 256_000

type AtomicChange =
  | { kind: "new"; value: CalendarLogEventGet }
  | { kind: "changed"; value: CalendarChangedItem }
  | { kind: "old"; value: CalendarLogEventGet }

export interface CalendarLogV1Fragment {
  item: CalendarLogV1
  /** Zero-based position of the first atomic change in this fragment. */
  startOffset: number
  /** Exclusive atomic-change position immediately after this fragment. */
  endOffset: number
  /** Whether this single-entry fragment necessarily exceeds the target. */
  oversized: boolean
}

export interface CalendarLogV1Projection {
  fragments: CalendarLogV1Fragment[]
  totalEntries: number
  oversizedAtomicEntries: number
}

const emptyChange = (): CalendarChangeGet => ({
  newItems: [],
  changedItems: [],
  oldItems: [],
})

const atomicChanges = (item: CalendarLogV1): AtomicChange[] => [
  ...item.calendarChange.newItems.map(
    (value): AtomicChange => ({ kind: "new", value }),
  ),
  ...item.calendarChange.changedItems.map(
    (value): AtomicChange => ({ kind: "changed", value }),
  ),
  ...item.calendarChange.oldItems.map(
    (value): AtomicChange => ({ kind: "old", value }),
  ),
]

const append = (change: CalendarChangeGet, atomic: AtomicChange) => {
  switch (atomic.kind) {
    case "new":
      change.newItems.push(atomic.value)
      return
    case "changed":
      change.changedItems.push(atomic.value)
      return
    case "old":
      change.oldItems.push(atomic.value)
  }
}

const fragmentId = (sourceId: string, fragmentIndex: number): string =>
  fragmentIndex === 0
    ? sourceId
    : `fragment_${createHash("sha256")
        .update(`calendar-log-v1\0${sourceId}\0${fragmentIndex}`)
        .digest("base64url")}`

const fragmentItem = (
  source: CalendarLogV1,
  fragmentIndex: number,
  calendarChange: CalendarChangeGet,
): CalendarLogV1 => ({
  ...source,
  id: fragmentId(source.id, fragmentIndex),
  calendarChange,
})

export const serializedJsonBytes = (value: unknown): number =>
  Buffer.byteLength(JSON.stringify(value), "utf8")

const atomicBytes = (atomic: AtomicChange): number =>
  serializedJsonBytes(atomic.value)

const collectionLength = (
  change: CalendarChangeGet,
  kind: AtomicChange["kind"],
): number => {
  switch (kind) {
    case "new":
      return change.newItems.length
    case "changed":
      return change.changedItems.length
    case "old":
      return change.oldItems.length
  }
}

/**
 * Projects one already-token-free v1 item into deterministic valid fragments.
 * Boundaries are computed from the complete source every time, so ids and
 * offsets do not depend on which page happens to request them.
 */
export const projectCalendarLogV1 = (
  source: CalendarLogV1,
): CalendarLogV1Projection => {
  const totalEntries =
    source.calendarChange.newItems.length +
    source.calendarChange.changedItems.length +
    source.calendarChange.oldItems.length
  if (serializedJsonBytes(source) <= MAX_FRAGMENT_BYTES || totalEntries === 0) {
    return {
      fragments: [
        {
          item: source,
          startOffset: 0,
          endOffset: totalEntries,
          oversized: false,
        },
      ],
      totalEntries,
      oversizedAtomicEntries: 0,
    }
  }

  const entries = atomicChanges(source)
  const fragments: CalendarLogV1Fragment[] = []
  let change = emptyChange()
  let item = fragmentItem(source, 0, change)
  let startOffset = 0
  let oversizedAtomicEntries = 0
  let currentBytes = serializedJsonBytes(item)

  const finish = (endOffset: number) => {
    const oversized = currentBytes > MAX_FRAGMENT_BYTES
    if (oversized) oversizedAtomicEntries += 1
    fragments.push({ item, startOffset, endOffset, oversized })
    if (endOffset < entries.length) {
      startOffset = endOffset
      change = emptyChange()
      item = fragmentItem(source, fragments.length, change)
      currentBytes = serializedJsonBytes(item)
    }
  }

  entries.forEach((entry, index) => {
    const valueBytes = atomicBytes(entry)
    const entryBytes =
      valueBytes + (collectionLength(change, entry.kind) > 0 ? 1 : 0)
    if (index > startOffset && currentBytes + entryBytes > MAX_FRAGMENT_BYTES) {
      finish(index)
    }
    append(change, entry)
    currentBytes +=
      valueBytes + (collectionLength(change, entry.kind) > 1 ? 1 : 0)
  })
  finish(entries.length)

  return {
    fragments,
    totalEntries: entries.length,
    oversizedAtomicEntries,
  }
}
