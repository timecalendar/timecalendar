import type { ChecklistProgressMap } from "@/features/event-checklists"

import type { CalendarEventRejectionCounts } from "./event-decoder"
import { type PageIndex, type PageSpace } from "./page-index"
import type { CalendarEvent } from "./types"
import type { FirstWeekday } from "./week"
import {
  chunkOfPage,
  type ChunkRange,
  chunkRange,
  type ChunkStart,
  requiredChunks,
} from "./window-chunks"

export const MAX_RESIDENT_CHUNKS = 6

export type PageStatus = "loading" | "ready" | "error"

export interface ChunkRead {
  /** Decoded, unfiltered events intersecting the chunk. */
  events: readonly CalendarEvent[]
  checklist: ChecklistProgressMap
}

export interface CalendarWindowRead {
  chunks: ReadonlyMap<ChunkStart, ChunkRead>
  visibleCalendarIds: ReadonlySet<string>
  rejectedCounts: CalendarEventRejectionCounts
}

export type CalendarWindowReader = (request: {
  chunks: readonly ChunkRange[]
  displayZone: string
}) => Promise<CalendarWindowRead>

export interface ChunkEntry {
  start: ChunkStart
  status: PageStatus
  /** True while a re-read is pending over rows that are still shown. */
  stale: boolean
  events: readonly CalendarEvent[]
  checklist: ChecklistProgressMap
  error: Error | undefined
  /** Sequence of the read that produced `events`; 0 before the first. */
  revision: number
}

export interface CalendarWindowSnapshot {
  displayZone: string
  firstWeekday: FirstWeekday
  chunks: ReadonlyMap<ChunkStart, ChunkEntry>
  visibleCalendarIds: ReadonlySet<string> | undefined
}

export interface CalendarWindowStore {
  subscribe(listener: () => void): () => void
  getSnapshot(): CalendarWindowSnapshot
  /** Makes the chunks around `center` resident, reading the missing ones. */
  ensure(space: PageSpace, center: PageIndex): void
  /** Re-reads every resident chunk in one batch, keeping previous rows. */
  invalidate(): void
  configure(environment: {
    displayZone: string
    firstWeekday: FirstWeekday
  }): void
  /** Subscribes to database changes; returns the disconnect. */
  connect(): () => void
}

interface MutableEntry extends ChunkEntry {
  requestedSeq: number
  settledSeq: number
}

const EMPTY_EVENTS: readonly CalendarEvent[] = Object.freeze([])
const EMPTY_CHECKLIST: ChecklistProgressMap = new Map()

function publicEntry(entry: MutableEntry): ChunkEntry {
  return Object.freeze({
    start: entry.start,
    status: entry.status,
    stale: entry.stale,
    events: entry.events,
    checklist: entry.checklist,
    error: entry.error,
    revision: entry.revision,
  })
}

export function createCalendarWindowStore(options: {
  reader: CalendarWindowReader
  subscribeToChanges: (listener: () => void) => () => void
  displayZone: string
  firstWeekday: FirstWeekday
  onRejectedRows?: (
    revision: string,
    counts: CalendarEventRejectionCounts,
  ) => void
  maxResidentChunks?: number
}): CalendarWindowStore {
  const maxResident = options.maxResidentChunks ?? MAX_RESIDENT_CHUNKS
  const listeners = new Set<() => void>()
  // Insertion order is recency: the first entry is the least recently required.
  const entries = new Map<ChunkStart, MutableEntry>()
  let displayZone = options.displayZone
  let firstWeekday = options.firstWeekday
  let visibleCalendarIds: ReadonlySet<string> | undefined
  let calendarsSeq = 0
  let seq = 0
  let snapshot = buildSnapshot()

  function buildSnapshot(): CalendarWindowSnapshot {
    return Object.freeze({
      displayZone,
      firstWeekday,
      chunks: new Map(
        [...entries].map(([start, entry]) => [start, publicEntry(entry)]),
      ),
      visibleCalendarIds,
    })
  }

  function publish(): void {
    snapshot = buildSnapshot()
    for (const listener of [...listeners]) listener()
  }

  function read(starts: readonly ChunkStart[]): void {
    if (starts.length === 0) return
    seq += 1
    const batch = seq
    for (const start of starts) {
      const entry = entries.get(start)
      if (entry === undefined) {
        entries.set(start, {
          start,
          status: "loading",
          stale: false,
          events: EMPTY_EVENTS,
          checklist: EMPTY_CHECKLIST,
          error: undefined,
          revision: 0,
          requestedSeq: batch,
          settledSeq: 0,
        })
      } else {
        entry.requestedSeq = batch
        entry.stale = entry.status === "ready"
      }
    }
    const zone = displayZone
    options
      .reader({
        chunks: starts.map((start) => chunkRange(start, zone)),
        displayZone: zone,
      })
      .then(
        (result) => complete(batch, starts, result),
        (error: unknown) => fail(batch, starts, error),
      )
  }

  function complete(
    batch: number,
    starts: readonly ChunkStart[],
    result: CalendarWindowRead,
  ): void {
    let changed = false
    for (const start of starts) {
      const entry = entries.get(start)
      if (entry === undefined || entry.requestedSeq !== batch) continue
      const chunk = result.chunks.get(start)
      entry.status = "ready"
      entry.stale = false
      entry.error = undefined
      entry.events = chunk?.events ?? EMPTY_EVENTS
      entry.checklist = chunk?.checklist ?? EMPTY_CHECKLIST
      entry.revision = batch
      entry.settledSeq = batch
      changed = true
    }
    if (batch > calendarsSeq) {
      calendarsSeq = batch
      visibleCalendarIds = result.visibleCalendarIds
      changed = true
    }
    options.onRejectedRows?.("calendar-window", result.rejectedCounts)
    if (changed) publish()
  }

  function fail(
    batch: number,
    starts: readonly ChunkStart[],
    error: unknown,
  ): void {
    let changed = false
    const failure = error instanceof Error ? error : new Error(String(error))
    for (const start of starts) {
      const entry = entries.get(start)
      if (entry === undefined || entry.requestedSeq !== batch) continue
      if (entry.status !== "ready") entry.status = "error"
      entry.stale = false
      entry.error = failure
      entry.settledSeq = batch
      changed = true
    }
    if (changed) publish()
  }

  function evict(required: ReadonlySet<ChunkStart>): void {
    for (const start of entries.keys()) {
      if (entries.size <= maxResident) return
      if (!required.has(start)) entries.delete(start)
    }
  }

  function isInFlight(entry: MutableEntry): boolean {
    return entry.requestedSeq !== entry.settledSeq
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    ensure(space, center) {
      if (space.firstWeekday !== firstWeekday) {
        throw new RangeError("Page space firstWeekday differs from the store")
      }
      const required = requiredChunks(space, center)
      const missing: ChunkStart[] = []
      for (const start of required) {
        const entry = entries.get(start)
        if (entry === undefined) {
          missing.push(start)
          continue
        }
        entries.delete(start)
        entries.set(start, entry)
        if (entry.status === "error" && !isInFlight(entry)) missing.push(start)
      }
      const before = entries.size
      read(missing)
      evict(new Set(required))
      if (missing.length > 0 || entries.size !== before) publish()
    },
    invalidate() {
      const resident = [...entries.keys()]
      read(resident)
      if (resident.length > 0) publish()
    },
    configure(environment) {
      if (environment.firstWeekday !== firstWeekday) {
        firstWeekday = environment.firstWeekday
        displayZone = environment.displayZone
        entries.clear()
        publish()
        return
      }
      if (environment.displayZone === displayZone) return
      displayZone = environment.displayZone
      const resident = [...entries.keys()]
      read(resident)
      publish()
    },
    connect() {
      const disconnect = options.subscribeToChanges(() => {
        const resident = [...entries.keys()]
        read(resident)
        if (resident.length > 0) publish()
      })
      const resident = [...entries.keys()]
      read(resident)
      if (resident.length > 0) publish()
      return disconnect
    },
  }
}

export interface PageEvents {
  status: PageStatus
  events: readonly CalendarEvent[]
  checklist: ChecklistProgressMap
  error: Error | undefined
  /** Changes whenever the page's rows change. */
  revision: number
}

export interface PageEventFilter {
  hiddenUids: ReadonlySet<string>
  hiddenNames: ReadonlySet<string>
}

/**
 * The page's chunk rows with the user's filters applied. A page whose chunk
 * has not been read yet is `loading` with no events, never a ready empty page.
 */
export function selectPageEvents(
  snapshot: CalendarWindowSnapshot,
  space: PageSpace,
  index: PageIndex,
  filter: PageEventFilter,
): PageEvents {
  const entry = snapshot.chunks.get(chunkOfPage(space, index))
  if (entry === undefined || entry.status === "loading") {
    return {
      status: "loading",
      events: EMPTY_EVENTS,
      checklist: EMPTY_CHECKLIST,
      error: undefined,
      revision: 0,
    }
  }
  const visible = snapshot.visibleCalendarIds
  const events =
    entry.status === "error"
      ? EMPTY_EVENTS
      : entry.events.filter(
          (event) =>
            !event.canceled &&
            !filter.hiddenUids.has(event.identity.uid) &&
            (event.title === undefined ||
              !filter.hiddenNames.has(event.title)) &&
            (event.identity.source === "personal" ||
              (event.userCalendarId !== undefined &&
                visible?.has(event.userCalendarId) === true)),
        )
  return {
    status: entry.status,
    events,
    checklist: entry.checklist,
    error: entry.error,
    revision: entry.revision,
  }
}
