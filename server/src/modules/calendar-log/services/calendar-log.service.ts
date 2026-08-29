import { Injectable } from "@nestjs/common"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { CalendarLogMapper } from "modules/calendar-log/mappers/calendar-log.mapper"
import { GetCalendarLogsDto } from "modules/calendar-log/models/dto/get-calendar-logs.dto"
import { CalendarLogGet } from "modules/calendar-log/models/dto/calendar-log-get.dto"
import {
  CalendarLogCursor,
  decodeCursor,
  encodeCursor,
  timestampTextToDate,
} from "modules/calendar-log/models/calendar-log-cursor"
import { CalendarLogSearchV1Response } from "modules/calendar-log/models/dto/calendar-log-search-v1-response.dto"
import { SearchCalendarLogsV1Dto } from "modules/calendar-log/models/dto/search-calendar-logs-v1.dto"
import { CalendarLogMetricsService } from "modules/calendar-log/services/calendar-log-metrics.service"

@Injectable()
export class CalendarLogService {
  constructor(
    private readonly repository: CalendarLogRepository,
    private readonly mapper: CalendarLogMapper,
    private readonly metrics: CalendarLogMetricsService,
  ) {}

  async getCalendarLogs(
    payload: GetCalendarLogsDto,
  ): Promise<CalendarLogGet[]> {
    const logs = await this.repository.findByCalendarTokens(payload.tokens)
    return logs.map((log) => this.mapper.toCalendarLogGet(log))
  }

  /**
   * One bounded, snapshot-bound page of calendar logs.
   *
   * Nothing here catches to log. The only deliberate throw is the malformed
   * cursor's `BadRequestException` with its constant message; anything else
   * propagates to Nest's default exception layer as the standard sanitized 5xx.
   * A hand-written catch on this path would be a chance to interpolate the
   * payload into a message, and a calendar token has no shape `sanitizeLog`'s
   * redactor can recognise — so not logging is the guarantee.
   */
  async searchV1(
    payload: SearchCalendarLogsV1Dto,
  ): Promise<CalendarLogSearchV1Response> {
    const page = payload.cursor ? "following" : "first"

    let cursor: CalendarLogCursor | null = null
    if (payload.cursor) {
      try {
        cursor = decodeCursor(payload.cursor)
      } catch (error) {
        // Records a counter with two literal labels and rethrows untouched.
        // This is telemetry, not logging: nothing about the value is emitted.
        this.metrics.recordSearch({ page, outcome: "invalid_cursor" })
        throw error
      }
    }

    if (payload.tokens.length === 0) {
      return this.emptyPage(cursor)
    }

    // A cursor carries its chain's snapshot forward; only a first page takes a
    // new one. That is what stops a log arriving mid-scroll from shifting the
    // window under the reader.
    const asOfText = cursor
      ? cursor.asOfText
      : (await this.repository.getSnapshotTime()).asOfText

    const rows = await this.repository.searchPage({
      tokens: payload.tokens,
      asOfText,
      cursor,
      // One row beyond the page decides whether a next page exists, with no
      // COUNT(*) over the whole match set.
      limit: payload.limit + 1,
    })

    const hasMore = rows.length > payload.limit
    const pageRows = hasMore ? rows.slice(0, payload.limit) : rows
    const last = pageRows[pageRows.length - 1]

    const unreadCount = await this.countUnread(payload, cursor, asOfText)

    this.metrics.recordPageRows(pageRows.length, page)
    this.metrics.recordSearch({ page, outcome: "ok" })

    return {
      items: pageRows.map((row) => this.mapper.toCalendarLogV1(row.log)),
      nextCursor:
        hasMore && last
          ? encodeCursor({
              asOfText,
              createdAtText: last.createdAtText,
              id: last.log.id,
            })
          : null,
      asOf: timestampTextToDate(asOfText),
      unreadCount,
    }
  }

  /**
   * A student holding no calendars still gets a database-sourced `asOf`, so the
   * client's read watermark never silently switches source depending on how
   * many calendars they hold. No `calendar_log` query runs at all.
   */
  private async emptyPage(
    cursor: CalendarLogCursor | null,
  ): Promise<CalendarLogSearchV1Response> {
    const asOf = cursor
      ? timestampTextToDate(cursor.asOfText)
      : (await this.repository.getSnapshotTime()).asOf

    return {
      items: [],
      nextCursor: null,
      asOf,
      // Nothing is unread when nothing is subscribed. Still omitted on a
      // following page, where the contract says `unreadCount` never appears.
      unreadCount: cursor ? undefined : 0,
    }
  }

  /**
   * The count is defined against the *first* page's snapshot, so it is computed
   * once per chain. A request carrying both a cursor and `unreadSince` pages
   * normally and omits the field rather than erroring — the API-behavior table
   * enumerates every 400 case and this is not one of them.
   */
  private async countUnread(
    payload: SearchCalendarLogsV1Dto,
    cursor: CalendarLogCursor | null,
    asOfText: string,
  ): Promise<number | undefined> {
    if (payload.unreadSince === undefined || cursor) return undefined

    const startedAt = performance.now()
    const count = await this.repository.countSince({
      tokens: payload.tokens,
      unreadSince: new Date(payload.unreadSince),
      asOfText,
    })
    this.metrics.recordUnreadCountDuration(performance.now() - startedAt)

    return count
  }
}
