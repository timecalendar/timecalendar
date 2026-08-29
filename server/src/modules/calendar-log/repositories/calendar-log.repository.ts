import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeepPartial, Repository, In } from "typeorm"
import { CalendarLogCursor } from "modules/calendar-log/models/calendar-log-cursor"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"

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

  /**
   * One page of the snapshot-bound keyset scan, newest first.
   *
   * The `(createdAt, id)` row-tuple comparison is a single index-orderable
   * predicate, and `id` makes rows sharing a `createdAt` paginate
   * deterministically. `deletedAt IS NULL` is spelled out because this query is
   * hand-built rather than going through TypeORM's `relations` option, which
   * would add it — dropping it would silently widen v1 beyond legacy behavior.
   */
  async searchPage({
    tokens,
    asOfText,
    cursor,
    limit,
  }: SearchPageParams): Promise<CalendarLogPageRow[]> {
    const query = this.repository
      .createQueryBuilder("cl")
      .innerJoinAndSelect("cl.calendar", "c", `c."deletedAt" IS NULL`)
      .addSelect(`cl."createdAt"::text`, "cl_created_at_text")
      .where(`c."token" = ANY(:tokens)`, { tokens })
      .andWhere(`cl."createdAt" <= CAST(:asOf AS timestamp)`, {
        asOf: asOfText,
      })
      .orderBy(`cl."createdAt"`, "DESC")
      .addOrderBy(`cl."id"`, "DESC")
      // A many-to-one join cannot multiply rows, so a plain LIMIT is correct
      // here and avoids the DISTINCT subquery `take()` would generate.
      .limit(limit)

    if (cursor) {
      query.andWhere(
        `(cl."createdAt", cl."id") < (CAST(:cursorCreatedAt AS timestamp), CAST(:cursorId AS uuid))`,
        { cursorCreatedAt: cursor.createdAtText, cursorId: cursor.id },
      )
    }

    const { entities, raw } = await query.getRawAndEntities()

    // Keyed by id rather than by position: raw/entity index alignment is not a
    // contract TypeORM promises.
    const createdAtTextById = new Map<string, string>(
      raw.map((row) => [row.cl_id, row.cl_created_at_text]),
    )

    return entities.map((log) => ({
      log,
      createdAtText: createdAtTextById.get(log.id) as string,
    }))
  }

  /**
   * Exact unread count for the first page, mirroring `searchPage`'s token and
   * soft-delete predicates. `unreadSince` is bound as a `Date` — the convention
   * `pruneOlderThan` already uses against this column.
   */
  countSince({ tokens, unreadSince, asOfText }: CountSinceParams) {
    return this.repository
      .createQueryBuilder("cl")
      .innerJoin("cl.calendar", "c", `c."deletedAt" IS NULL`)
      .where(`c."token" = ANY(:tokens)`, { tokens })
      .andWhere(`cl."createdAt" > :unreadSince`, { unreadSince })
      .andWhere(`cl."createdAt" <= CAST(:asOf AS timestamp)`, {
        asOf: asOfText,
      })
      .getCount()
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
