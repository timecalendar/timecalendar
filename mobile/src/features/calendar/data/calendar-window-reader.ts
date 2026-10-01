import { findAll as findAllUserCalendars } from "@/features/calendar-sources/data"
import {
  type ChecklistProgress,
  readChecklistProgress,
} from "@/features/event-checklists"
import { selectPersonalEventRowsInRange } from "@/features/personal-events"

import type {
  CalendarWindowRead,
  CalendarWindowReader,
  ChunkRead,
} from "./calendar-window-store"
import {
  CALENDAR_EVENT_REJECTION_REASONS,
  type CalendarEventRejectionCounts,
  decodePersonalEventRows,
  decodeSyncedEventRows,
} from "./event-decoder"
import { intersectsRange } from "./events"
import { selectSyncedTimedRowsInRange } from "./sync/hooks"
import type { ChunkStart } from "./window-chunks"

function addCounts(
  left: CalendarEventRejectionCounts,
  right: CalendarEventRejectionCounts,
): CalendarEventRejectionCounts {
  return Object.fromEntries(
    CALENDAR_EVENT_REJECTION_REASONS.map((reason) => [
      reason,
      left[reason] + right[reason],
    ]),
  ) as CalendarEventRejectionCounts
}

/**
 * One batched read for every requested chunk: a single range scan per table
 * over the union of the chunks, then one checklist read for the events found.
 * Date-only rows are not read; the timeline does not render them.
 */
export const readCalendarWindow: CalendarWindowReader = async ({ chunks }) => {
  const from = new Date(
    Math.min(...chunks.map((chunk) => chunk.from.getTime())),
  )
  const to = new Date(Math.max(...chunks.map((chunk) => chunk.to.getTime())))
  const [syncedRows, personalRows, calendars] = await Promise.all([
    selectSyncedTimedRowsInRange({ from, to }),
    selectPersonalEventRowsInRange({ from, to }),
    findAllUserCalendars(),
  ])
  const synced = decodeSyncedEventRows(syncedRows)
  const personal = decodePersonalEventRows(personalRows)
  const events = [...synced.accepted, ...personal.accepted]
  const progress = await readChecklistProgress(
    events.map((event) => event.identity.uid),
  )

  const reads = new Map<ChunkStart, ChunkRead>()
  for (const chunk of chunks) {
    const chunkEvents = events.filter((event) => intersectsRange(event, chunk))
    const checklist = new Map<string, ChecklistProgress>()
    for (const event of chunkEvents) {
      const entry = progress.get(event.identity.uid)
      if (entry !== undefined) checklist.set(event.identity.uid, entry)
    }
    reads.set(chunk.start, {
      events: Object.freeze(chunkEvents),
      checklist,
    })
  }
  const visibleCalendarIds = new Set<string>()
  for (const calendar of calendars) {
    if (calendar.visible) visibleCalendarIds.add(calendar.id)
  }
  const read: CalendarWindowRead = {
    chunks: reads,
    visibleCalendarIds,
    rejectedCounts: addCounts(synced.rejectedCounts, personal.rejectedCounts),
  }
  return read
}
