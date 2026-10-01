import { type EpochDay, epochDayStart } from "./epoch-day"
import { type PageIndex, type PageSpace, pageStartDay } from "./page-index"
import { MOUNTED_PAGE_RADIUS } from "./page-window"
import type { FirstWeekday } from "./week"

export const CHUNK_DAYS = 28
export const CHUNK_PREFETCH = 1

/** First civil day of a 28-day chunk aligned to `firstWeekday`. */
export type ChunkStart = EpochDay

export interface ChunkRange {
  start: ChunkStart
  from: Date
  to: Date
}

// Same origin as week pages, so every week page and every day page lies
// inside exactly one chunk.
function chunkOrigin(firstWeekday: FirstWeekday): EpochDay {
  return (firstWeekday + 3) % 7
}

export function chunkStartOfDay(
  day: EpochDay,
  firstWeekday: FirstWeekday,
): ChunkStart {
  const origin = chunkOrigin(firstWeekday)
  return Math.floor((day - origin) / CHUNK_DAYS) * CHUNK_DAYS + origin
}

export function chunkOfPage(space: PageSpace, index: PageIndex): ChunkStart {
  return chunkStartOfDay(pageStartDay(space, index), space.firstWeekday)
}

/** Chunks holding the mounted pages around `center`, plus ±1 chunk of prefetch. */
export function requiredChunks(
  space: PageSpace,
  center: PageIndex,
): readonly ChunkStart[] {
  const first =
    chunkOfPage(space, center - MOUNTED_PAGE_RADIUS) -
    CHUNK_PREFETCH * CHUNK_DAYS
  const last =
    chunkOfPage(space, center + MOUNTED_PAGE_RADIUS) +
    CHUNK_PREFETCH * CHUNK_DAYS
  return Array.from(
    { length: (last - first) / CHUNK_DAYS + 1 },
    (_, i) => first + i * CHUNK_DAYS,
  )
}

export function chunkRange(start: ChunkStart, zone: string): ChunkRange {
  return {
    start,
    from: epochDayStart(start, zone),
    to: epochDayStart(start + CHUNK_DAYS, zone),
  }
}
