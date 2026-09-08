import { BadRequestException, Injectable } from "@nestjs/common"
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
import {
  CalendarLogV1Fragment,
  projectCalendarLogV1,
} from "modules/calendar-log/models/calendar-log-v1-projection"

export const MAX_SERIALIZED_PAGE_BYTES = 900_000
const INVALID_CURSOR = "Invalid cursor"

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
   * payload into a message. `sanitizeLog`'s id rule does target the opaque
   * `nanoid()` run a calendar token is, but a redactor is a pattern match with
   * edges — never emitting the token is a stronger guarantee than trusting
   * one, so not logging is what this path relies on.
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

    const resumeOffset =
      cursor?.version === 2 && cursor.offset > 0 ? cursor.offset : null
    const inclusiveResume = resumeOffset !== null
    const rows = await this.repository.searchPage({
      tokens: payload.tokens,
      asOfText,
      cursor,
      // One source row beyond the maximum number of virtual items decides
      // whether the chain continues. An inclusive fragment resume can add its
      // anchored row without reducing that look-ahead.
      limit: payload.limit + 1 + (inclusiveResume ? 1 : 0),
    })

    const unreadCount = await this.countUnread(payload, cursor, asOfText)

    if (
      inclusiveResume &&
      (rows[0]?.log.id !== cursor?.id ||
        rows[0]?.createdAtText !== cursor?.createdAtText)
    ) {
      throw new BadRequestException(INVALID_CURSOR)
    }

    const asOf = timestampTextToDate(asOfText)
    let response: CalendarLogSearchV1Response = {
      items: [],
      nextCursor: null,
      asOf,
      unreadCount,
    }
    const consumedRows = new Set<string>()
    let overflowEntries = 0

    outer: for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex]
      const projection = projectCalendarLogV1(
        this.mapper.toCalendarLogV1(row.log),
      )
      let fragments: CalendarLogV1Fragment[] = projection.fragments
      if (rowIndex === 0 && resumeOffset !== null) {
        if (resumeOffset >= projection.totalEntries) {
          throw new BadRequestException(INVALID_CURSOR)
        }
        const fragmentIndex = fragments.findIndex(
          (fragment) => fragment.startOffset === resumeOffset,
        )
        if (fragmentIndex === -1) throw new BadRequestException(INVALID_CURSOR)
        fragments = fragments.slice(fragmentIndex)
      }

      for (
        let fragmentIndex = 0;
        fragmentIndex < fragments.length;
        fragmentIndex += 1
      ) {
        const fragment = fragments[fragmentIndex]
        const hasLaterFragment = fragmentIndex + 1 < fragments.length
        const hasLaterRow = rowIndex + 1 < rows.length
        const nextCursor =
          hasLaterFragment || hasLaterRow
            ? encodeCursor({
                version: 2,
                asOfText,
                createdAtText: row.createdAtText,
                id: row.log.id,
                offset: hasLaterFragment ? fragment.endOffset : 0,
              })
            : null
        const candidate: CalendarLogSearchV1Response = {
          items: [...response.items, fragment.item],
          nextCursor,
          asOf,
          unreadCount,
        }

        if (
          response.items.length > 0 &&
          Buffer.byteLength(JSON.stringify(candidate), "utf8") >
            MAX_SERIALIZED_PAGE_BYTES
        ) {
          break outer
        }

        response = candidate
        consumedRows.add(row.log.id)
        if (fragment.oversized) overflowEntries += 1
        if (response.items.length === payload.limit) break outer
      }
    }

    this.metrics.recordPageRows(consumedRows.size, page)
    if (overflowEntries > 0) {
      this.metrics.recordFragmentOverflow(overflowEntries)
    }
    this.metrics.recordSearch({ page, outcome: "ok" })

    return response
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
