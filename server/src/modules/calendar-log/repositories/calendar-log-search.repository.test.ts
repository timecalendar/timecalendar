import { NestExpressApplication } from "@nestjs/platform-express"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarLogModule } from "modules/calendar-log/calendar-log.module"
import { calendarLogFactory } from "modules/calendar-log/factories/calendar-log.factory"
import { CalendarLogCursor } from "modules/calendar-log/models/calendar-log-cursor"
import {
  CalendarLogPageRow,
  CalendarLogRepository,
} from "modules/calendar-log/repositories/calendar-log.repository"
import { DataSource } from "typeorm"
import createTestApp from "test-utils/create-test-app"

describe("CalendarLogRepository search", () => {
  let app: NestExpressApplication
  let repository: CalendarLogRepository
  let dataSource: DataSource

  beforeAll(async () => {
    app = await createTestApp({ imports: [CalendarLogModule] })
    repository = app.get(CalendarLogRepository)
    dataSource = app.get(DataSource)
  })

  /**
   * Writes an explicit `createdAt`. `DEFAULT now()` cannot reliably reproduce a
   * timestamp collision — or a sub-millisecond gap — so the ordering and
   * precision tests below set the column directly.
   */
  const createLogAt = async (calendar: Calendar, createdAt: string) => {
    const log = await calendarLogFactory().calendar(calendar.id).create()
    await dataSource.query(
      `UPDATE "calendar_log" SET "createdAt" = CAST($1 AS timestamp) WHERE "id" = $2`,
      [createdAt, log.id],
    )
    return log.id
  }

  const snapshot = () => repository.getSnapshotTime()

  const idsOf = (rows: CalendarLogPageRow[]) => rows.map((row) => row.log.id)

  /** Walks the whole chain the way the service does, one page at a time. */
  const pageThrough = async (
    tokens: string[],
    asOfText: string,
    limit: number,
  ) => {
    const seen: string[] = []
    let cursor: CalendarLogCursor | null = null

    for (let page = 0; page < 20; page++) {
      const rows = await repository.searchPage({
        tokens,
        asOfText,
        cursor,
        limit: limit + 1,
      })
      const pageRows = rows.slice(0, limit)
      seen.push(...idsOf(pageRows))

      if (rows.length <= limit || pageRows.length === 0) return seen

      const last = pageRows[pageRows.length - 1]
      cursor = {
        asOfText,
        createdAtText: last.createdAtText,
        id: last.log.id,
      }
    }

    throw new Error("pagination did not terminate")
  }

  describe("getSnapshotTime", () => {
    it("returns the database clock in both forms", async () => {
      const { asOf, asOfText } = await snapshot()

      expect(asOf).toBeInstanceOf(Date)
      expect(asOfText).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?$/,
      )
      // Same instant to the millisecond a Date can hold.
      expect(asOfText.startsWith(asOf.toISOString().slice(0, 10))).toBe(true)
    })
  })

  describe("searchPage", () => {
    it("orders strictly by createdAt DESC, id DESC across calendars", async () => {
      const [a, b, c] = await Promise.all([
        calendarFactory().create(),
        calendarFactory().create(),
        calendarFactory().create(),
      ])

      // Interleaved across three calendars.
      const first = await createLogAt(a, "2026-08-01 10:00:05")
      const second = await createLogAt(b, "2026-08-01 10:00:04")
      const third = await createLogAt(c, "2026-08-01 10:00:03")
      const fourth = await createLogAt(a, "2026-08-01 10:00:02")
      const fifth = await createLogAt(b, "2026-08-01 10:00:01")

      const { asOfText } = await snapshot()
      const rows = await repository.searchPage({
        tokens: [a.token, b.token, c.token],
        asOfText,
        cursor: null,
        limit: 10,
      })

      expect(idsOf(rows)).toEqual([first, second, third, fourth, fifth])
    })

    it("returns every row exactly once when timestamps are equal across a page boundary", async () => {
      const calendar = await calendarFactory().create()
      const shared = "2026-08-01 10:00:00.500000"
      const ids = [
        await createLogAt(calendar, shared),
        await createLogAt(calendar, shared),
        await createLogAt(calendar, shared),
        await createLogAt(calendar, shared),
        await createLogAt(calendar, shared),
      ]

      const { asOfText } = await snapshot()
      const seen = await pageThrough([calendar.token], asOfText, 2)

      expect(seen).toHaveLength(5)
      expect(new Set(seen)).toEqual(new Set(ids))
      // Within one shared timestamp, ordering is by descending id.
      expect(seen).toEqual([...ids].sort().reverse())
    })

    // The D3 regression: a cursor round-tripped through a JS `Date` truncates
    // `.641234` to `.641`, and the next page's keyset predicate then skips every
    // row in between. Nothing about "no duplicates" would catch it.
    it("returns every row exactly once when timestamps differ only below millisecond precision", async () => {
      const calendar = await calendarFactory().create()
      const ids = [
        await createLogAt(calendar, "2026-08-01 10:00:25.641000"),
        await createLogAt(calendar, "2026-08-01 10:00:25.641234"),
        await createLogAt(calendar, "2026-08-01 10:00:25.641567"),
        await createLogAt(calendar, "2026-08-01 10:00:25.641999"),
      ]

      const { asOfText } = await snapshot()
      const seen = await pageThrough([calendar.token], asOfText, 2)

      expect(seen).toHaveLength(4)
      expect(new Set(seen)).toEqual(new Set(ids))
      expect(seen).toEqual([...ids].reverse())
    })

    it("exposes the database's full-precision createdAt text", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 10:00:25.641234")

      const { asOfText } = await snapshot()
      const [row] = await repository.searchPage({
        tokens: [calendar.token],
        asOfText,
        cursor: null,
        limit: 10,
      })

      expect(row.createdAtText).toBe("2026-08-01 10:00:25.641234")
      // A Date could not have carried those last three digits.
      expect(row.log.createdAt.getTime() % 1000).toBe(641)
    })

    it("excludes rows written after the snapshot from every page", async () => {
      const calendar = await calendarFactory().create()
      const before = [
        await createLogAt(calendar, "2026-08-01 10:00:03"),
        await createLogAt(calendar, "2026-08-01 10:00:02"),
        await createLogAt(calendar, "2026-08-01 10:00:01"),
      ]

      const { asOfText } = await snapshot()
      // Arrives mid-scroll. Left on `DEFAULT now()` so it is genuinely newer
      // than the snapshot rather than newer than a backdated fixture.
      const after = await calendarLogFactory().calendar(calendar.id).create()

      const seen = await pageThrough([calendar.token], asOfText, 2)

      expect(seen).toEqual(before)
      expect(seen).not.toContain(after.id)
    })

    it("excludes logs belonging to a soft-deleted calendar", async () => {
      const live = await calendarFactory().create()
      const removed = await calendarFactory().create()
      const liveLog = await createLogAt(live, "2026-08-01 10:00:02")
      await createLogAt(removed, "2026-08-01 10:00:01")

      await dataSource.query(
        `UPDATE "calendar" SET "deletedAt" = now() WHERE "id" = $1`,
        [removed.id],
      )

      const { asOfText } = await snapshot()
      const rows = await repository.searchPage({
        tokens: [live.token, removed.token],
        asOfText,
        cursor: null,
        limit: 10,
      })

      expect(idsOf(rows)).toEqual([liveLog])
    })

    it("returns nothing for unknown tokens without failing", async () => {
      const { asOfText } = await snapshot()

      const rows = await repository.searchPage({
        tokens: ["unknown-token"],
        asOfText,
        cursor: null,
        limit: 10,
      })

      expect(rows).toEqual([])
    })

    it("returns only the known tokens' rows when unknown ones are mixed in", async () => {
      const calendar = await calendarFactory().create()
      const known = await createLogAt(calendar, "2026-08-01 10:00:01")

      const { asOfText } = await snapshot()
      const rows = await repository.searchPage({
        tokens: [calendar.token, "unknown-token"],
        asOfText,
        cursor: null,
        limit: 10,
      })

      expect(idsOf(rows)).toEqual([known])
    })

    it("hydrates the calendar relation", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 10:00:01")

      const { asOfText } = await snapshot()
      const [row] = await repository.searchPage({
        tokens: [calendar.token],
        asOfText,
        cursor: null,
        limit: 10,
      })

      expect(row.log.calendar.id).toBe(calendar.id)
      expect(row.log.calendar.name).toBe(calendar.name)
    })
  })

  describe("countSince", () => {
    it("counts only rows after the watermark and at or before the snapshot", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 09:00:00")
      await createLogAt(calendar, "2026-08-01 11:00:00")
      await createLogAt(calendar, "2026-08-01 12:00:00")

      const asOfText = "2026-08-01 11:30:00"
      const count = await repository.countSince({
        tokens: [calendar.token],
        unreadSince: new Date("2026-08-01T10:00:00.000Z"),
        asOfText,
      })

      // 09:00 is before the watermark, 12:00 is after the snapshot.
      expect(count).toBe(1)
    })

    it("respects token scope", async () => {
      const mine = await calendarFactory().create()
      const other = await calendarFactory().create()
      await createLogAt(mine, "2026-08-01 11:00:00")
      await createLogAt(other, "2026-08-01 11:00:00")

      const count = await repository.countSince({
        tokens: [mine.token],
        unreadSince: new Date("2026-08-01T10:00:00.000Z"),
        asOfText: "2026-08-01 11:30:00",
      })

      expect(count).toBe(1)
    })

    // countSince uses COUNT(*), not COUNT(DISTINCT id). That is only correct
    // because the calendar join is many-to-one; this asserts the join really
    // cannot multiply a log row across several calendars and tokens.
    it("counts each log once across many calendars and tokens", async () => {
      const calendars = await Promise.all([
        calendarFactory().create(),
        calendarFactory().create(),
        calendarFactory().create(),
      ])
      for (const calendar of calendars) {
        await createLogAt(calendar, "2026-08-01 11:00:00")
        await createLogAt(calendar, "2026-08-01 11:30:00")
      }

      const count = await repository.countSince({
        tokens: calendars.map((c) => c.token),
        unreadSince: new Date("2026-08-01T10:00:00.000Z"),
        asOfText: "2026-08-01 12:00:00",
      })

      expect(count).toBe(6)
    })

    it("returns a number, not a bigint string", async () => {
      const calendar = await calendarFactory().create()
      await createLogAt(calendar, "2026-08-01 11:00:00")

      const count = await repository.countSince({
        tokens: [calendar.token],
        unreadSince: new Date("2026-08-01T10:00:00.000Z"),
        asOfText: "2026-08-01 12:00:00",
      })

      expect(typeof count).toBe("number")
      expect(count).toBe(1)
    })

    it("excludes soft-deleted calendars", async () => {
      const removed = await calendarFactory().create()
      await createLogAt(removed, "2026-08-01 11:00:00")
      await dataSource.query(
        `UPDATE "calendar" SET "deletedAt" = now() WHERE "id" = $1`,
        [removed.id],
      )

      const count = await repository.countSince({
        tokens: [removed.token],
        unreadSince: new Date("2026-08-01T10:00:00.000Z"),
        asOfText: "2026-08-01 11:30:00",
      })

      expect(count).toBe(0)
    })
  })
})
