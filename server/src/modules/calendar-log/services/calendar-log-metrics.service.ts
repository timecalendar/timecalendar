import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"

/** Which page of a chain a request asked for. Never derived from request data. */
export type CalendarLogSearchPage = "first" | "following"

export type CalendarLogSearchOutcome = "ok" | "invalid_cursor"

// A type alias, not an interface: only aliases get the implicit index signature
// OpenTelemetry's `Attributes` parameter requires.
export type CalendarLogSearchAttributes = {
  page: CalendarLogSearchPage
  outcome: CalendarLogSearchOutcome
}

/**
 * Telemetry for the v1 search path.
 *
 * Every label value below is a literal from a TypeScript union — at most four
 * combinations — so nothing derived from a token, calendar, user, event, log id
 * or cursor can reach a metric label. Row counts and durations are aggregate
 * numbers, not identifiers.
 *
 * Deliberately narrow: HTTP route latency and status already come free from
 * auto-instrumentation, so these three cover only what the capacity gate asks
 * for (page payload size, unread-count cost, first-page/cursor outcome).
 */
@Injectable()
export class CalendarLogMetricsService {
  private readonly pageRows = meter.createHistogram(
    "calendar_log_search_page_rows",
    { unit: "{rows}", description: "Rows returned by one v1 search page" },
  )

  private readonly unreadCountDuration = meter.createHistogram(
    "calendar_log_unread_count_duration",
    { unit: "ms", description: "Duration of the v1 unread-count query" },
  )

  private readonly searchCounter = meter.createCounter(
    "calendar_log_search_total",
    { unit: "{requests}", description: "v1 calendar-log search outcomes" },
  )

  recordPageRows(rows: number, page: CalendarLogSearchPage) {
    this.pageRows.record(rows, { page })
  }

  recordUnreadCountDuration(durationMs: number) {
    this.unreadCountDuration.record(durationMs)
  }

  recordSearch(attributes: CalendarLogSearchAttributes) {
    this.searchCounter.add(1, attributes)
  }
}
