import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeepPartial, Repository, In } from "typeorm"
import { CalendarLogCursor } from "modules/calendar-log/models/calendar-log-cursor"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { Calendar } from "modules/calendar/models/calendar.entity"
import {
  calendarLogPageLateralSql,
  resolveCalendarsByTokenSql,
  unreadCountSql,
} from "modules/calendar-log/repositories/activity-search.queries"

/**
 * One page row: the hydrated entity plus the database's own full-precision
 * `createdAt` rendering. The text is what the cursor is built from — a JS
 * `Date` only holds milliseconds and would silently drop rows (see design D3).
 */
export interface CalendarLogPageRow {
  log: CalendarLog
  createdAtText: string
}

export interface SearchPageParams {
  tokens: string[]
  /** Snapshot watermark as Postgres timestamp text. */
  asOfText: string
  cursor: CalendarLogCursor | null
  /** Exact number of rows to fetch; the caller asks for one extra. */
  limit: number
}

export interface CountSinceParams {
  tokens: string[]
  unreadSince: Date
  asOfText: string
}

interface ResolvedCalendar {
  id: string
  name: string
}

interface RawCalendarLogPageRow {
  id: string
  calendarId: string
  calendarChange: CalendarLog["calendarChange"]
  createdAt: Date
  updatedAt: Date
  createdAtText: string
}

@Injectable()
export class CalendarLogRepository {
  constructor(
    @InjectRepository(CalendarLog)
    private readonly repository: Repository<CalendarLog>,
  ) {}

  save(calendarLog: DeepPartial<CalendarLog>) {
    return this.repository.save(calendarLog)
  }

  findByCalendarId(calendarId: string) {
    return this.repository.find({
      relations: { calendar: true },
      where: { calendar: { id: calendarId } },
      order: { createdAt: "DESC" },
    })
  }

  findByCalendarTokens(tokens: string[]) {
    return this.repository.find({
      relations: { calendar: true },
      where: { calendar: { token: In(tokens) } },
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Captures the pagination snapshot from the *database* clock, in both forms
   * one round trip yields: the `Date` goes on the wire, the text goes in the
   * cursor at full microsecond precision.
   *
   * The `::timestamp` cast matches how `createdAt` is stored, so the two are
   * directly comparable. This relies on the DB session and the Node process
   * sharing a timezone — both run UTC (the container's Postgres reports
   * `TimeZone = Etc/UTC`, and jest's global-setup pins `process.env.TZ`). The
   * shipped prune job already depends on the same invariant.
   */
  async getSnapshotTime(): Promise<{ asOf: Date; asOfText: string }> {
    const [row]: { asOf: Date; asOfText: string }[] =
      await this.repository.query(
        `SELECT now()::timestamp AS "asOf", (now()::timestamp)::text AS "asOfText"`,
      )
    return row
  }

  private async resolveCalendars(tokens: string[]) {
    return this.repository.query<ResolvedCalendar[]>(
      resolveCalendarsByTokenSql,
      [tokens],
    )
  }

  /**
   * One page of the snapshot-bound keyset scan, newest first. The shared SQL
   * gathers a bounded branch per resolved calendar and merges those branches,
   * preventing PostgreSQL from walking the global createdAt index when a large
   * calendar cohort has no logs.
   */
  async searchPage({
    tokens,
    asOfText,
    cursor,
    limit,
  }: SearchPageParams): Promise<CalendarLogPageRow[]> {
    const calendars = await this.resolveCalendars(tokens)
    if (calendars.length === 0) return []

    const calendarNames = new Map(
      calendars.map((calendar) => [calendar.id, calendar.name]),
    )
    const parameters = cursor
      ? [
          calendars.map((calendar) => calendar.id),
          asOfText,
          cursor.createdAtText,
          cursor.id,
          limit,
        ]
      : [calendars.map((calendar) => calendar.id), asOfText, limit]
    const rows = await this.repository.query<RawCalendarLogPageRow[]>(
      calendarLogPageLateralSql(Boolean(cursor)),
      parameters,
    )

    return rows.map((row) => ({
      log: Object.assign(new CalendarLog(), {
        id: row.id,
        calendar: {
          id: row.calendarId,
          name: calendarNames.get(row.calendarId) as string,
        } as Calendar,
        calendarChange: row.calendarChange,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
      createdAtText: row.createdAtText,
    }))
  }

  /**
   * Exact unread count for the first page, mirroring `searchPage`'s token and
   * soft-delete predicates. `unreadSince` is bound as a `Date` — the convention
   * `pruneOlderThan` already uses against this column.
   *
   * Deliberately a plain `COUNT(*)` rather than TypeORM's `getCount()`, which
   * emits `COUNT(DISTINCT cl.id)`. `calendar_log.calendarId` is many-to-one, so
   * the join cannot duplicate a log and the DISTINCT is redundant — but it is
   * not free: it forces a sort that spills to a temp file and pushes the
   * planner onto a sequential scan of `calendar_log`. Measured on an 800k-row
   * fixture, 100 calendars at a one-year watermark: `COUNT(DISTINCT)` p95
   * 197.5 ms with a Parallel Seq Scan, `COUNT(*)` p95 24.6 ms with none, and
   * both return the identical count.
   */
  async countSince({
    tokens,
    unreadSince,
    asOfText,
  }: CountSinceParams): Promise<number> {
    const calendars = await this.resolveCalendars(tokens)
    if (calendars.length === 0) return 0

    const [result] = await this.repository.query<{ unreadCount: number }[]>(
      unreadCountSql,
      [calendars.map((calendar) => calendar.id), unreadSince, asOfText],
    )

    return Number(result?.unreadCount ?? 0)
  }

  // Bounded batches keep each DELETE's lock footprint and WAL burst small.
  async pruneOlderThan(cutoff: Date, batchSize: number): Promise<number> {
    let total = 0
    let deleted: number
    do {
      // postgres driver returns [rows, rowCount] for DELETE … RETURNING
      const [rows]: [{ id: string }[], number] = await this.repository.query(
        `DELETE FROM "calendar_log" WHERE "id" IN (
           SELECT "id" FROM "calendar_log" WHERE "createdAt" < $1 LIMIT $2
         ) RETURNING "id"`,
        [cutoff, batchSize],
      )
      deleted = rows.length
      total += deleted
    } while (deleted === batchSize)
    return total
  }
}
