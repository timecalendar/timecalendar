import { epochDayKey, epochDayOfKey, weekdayOfEpochDay } from "./epoch-day"
import { pageDays, pageIndexOfDay, type PageSpace } from "./page-index"
import {
  CHUNK_DAYS,
  chunkOfPage,
  chunkRange,
  chunkStartOfDay,
  requiredChunks,
} from "./window-chunks"

const WEEKS: PageSpace = { mode: "week", firstWeekday: 1 }
const DAYS: PageSpace = { mode: "day", firstWeekday: 1 }

describe("window chunks", () => {
  it.each([0, 1, 2, 3, 4, 5, 6] as const)(
    "aligns 28-day chunks to firstWeekday %i so each page lies in exactly one chunk",
    (firstWeekday) => {
      const weeks: PageSpace = { mode: "week", firstWeekday }
      for (let index = -10; index < 10; index += 1) {
        const days = pageDays(weeks, index)
        const chunks = new Set(
          days.map((day) => chunkStartOfDay(day, firstWeekday)),
        )
        expect(chunks.size).toBe(1)
        const [start] = chunks
        expect(weekdayOfEpochDay(start!)).toBe(firstWeekday)
        expect(chunkOfPage(weeks, index)).toBe(start)
      }
    },
  )

  it("assigns every day of a chunk to that chunk", () => {
    const start = chunkStartOfDay(epochDayOfKey("2026-10-01"), 1)
    expect(epochDayKey(start)).toBe("2026-09-28")
    for (let day = start; day < start + CHUNK_DAYS; day += 1) {
      expect(chunkStartOfDay(day, 1)).toBe(start)
    }
    expect(chunkStartOfDay(start - 1, 1)).toBe(start - CHUNK_DAYS)
    expect(chunkStartOfDay(start + CHUNK_DAYS, 1)).toBe(start + CHUNK_DAYS)
  })

  it("requires the chunks of the mounted pages plus one chunk either side", () => {
    const center = pageIndexOfDay(WEEKS, epochDayOfKey("2026-10-01"))
    const required = requiredChunks(WEEKS, center).map(epochDayKey)
    expect(required).toEqual([
      "2026-08-03",
      "2026-08-31",
      "2026-09-28",
      "2026-10-26",
    ])
    const day = epochDayOfKey("2026-10-01")
    expect(requiredChunks(DAYS, day).map(epochDayKey)).toEqual([
      "2026-08-31",
      "2026-09-28",
      "2026-10-26",
    ])
  })

  it("never requires more than four chunks", () => {
    for (let index = 0; index < 60; index += 1) {
      expect(requiredChunks(WEEKS, index).length).toBeLessThanOrEqual(4)
      expect(requiredChunks(DAYS, index).length).toBeLessThanOrEqual(4)
    }
  })

  it("bounds a chunk by display-zone midnights across DST", () => {
    const start = chunkStartOfDay(epochDayOfKey("2026-10-20"), 1)
    const range = chunkRange(start, "Europe/Paris")
    expect(range.start).toBe(start)
    expect(range.from.toISOString()).toBe("2026-09-27T22:00:00.000Z")
    expect(range.to.toISOString()).toBe("2026-10-25T23:00:00.000Z")
  })
})
