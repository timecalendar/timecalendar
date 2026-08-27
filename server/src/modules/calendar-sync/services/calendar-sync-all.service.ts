import { Injectable } from "@nestjs/common"
import { USER_SYNC_CONCURRENCY } from "modules/calendar-sync/calendar-sync.constants"
import {
  CalendarSyncContext,
  CalendarSyncAbortError,
} from "modules/calendar-sync/models/calendar-sync-context"
import { SyncCalendarsDto } from "modules/calendar-sync/models/dto/sync-calendars.dto"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarService } from "modules/calendar/services/calendar.service"
import { withCalendarSyncSpan } from "modules/calendar-sync/calendar-sync-tracing"
import {
  CalendarSyncMetricsService,
  CalendarSyncOutcome,
} from "./calendar-sync-metrics.service"

@Injectable()
export class CalendarSyncAllService {
  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly calendarRepository: CalendarRepository,
    private readonly calendarService: CalendarService,
    private readonly metrics: CalendarSyncMetricsService,
  ) {}

  async syncAllForUser(
    { tokens }: SyncCalendarsDto,
    context: CalendarSyncContext = {},
  ) {
    return withCalendarSyncSpan("calendar_sync.batch", async () => {
      const startedAt = performance.now()
      let outcome: CalendarSyncOutcome = "success"
      let counts = { selected: 0, started: 0, completed: 0 }
      try {
        const calendars = await withCalendarSyncSpan(
          "calendar_sync.candidate_selection",
          () =>
            this.metrics.measurePhase("candidate_selection", () =>
              this.calendarRepository.findDueForSync({
                syncPlannedBefore: new Date(),
                filterByTokens: tokens,
              }),
            ),
        )
        counts.selected = calendars.length
        counts = {
          ...counts,
          ...(await runBoundedCalendarSync(
            calendars,
            (calendar) =>
              withCalendarSyncSpan("calendar_sync.calendar_work", () =>
                this.metrics.measurePhase("calendar_work", () =>
                  this.calendarSyncService.sync(calendar, context),
                ),
              ),
            context.signal,
          )),
        }
        if (context.signal?.reason instanceof CalendarSyncAbortError) {
          outcome =
            context.signal.reason.kind === "deadline"
              ? "partial_deadline"
              : "client_cancelled"
        }
        await this.calendarRepository.setCalendarsLastAccessedAt(
          tokens,
          new Date(),
        )
        return await withCalendarSyncSpan(
          "calendar_sync.response_hydration",
          () =>
            this.metrics.measurePhase("response_hydration", () =>
              this.calendarService.findCalendarsForPublic(tokens),
            ),
        )
      } catch (error) {
        outcome = "error"
        throw error
      } finally {
        this.metrics.recordBatch(performance.now() - startedAt, outcome, counts)
      }
    })
  }
}

export const runBoundedCalendarSync = async <T>(
  calendars: T[],
  sync: (calendar: T) => Promise<unknown>,
  signal?: AbortSignal,
) => {
  let nextIndex = 0
  let started = 0
  let completed = 0
  const worker = async () => {
    while (!signal?.aborted) {
      const index = nextIndex++
      if (index >= calendars.length) return
      started++
      await sync(calendars[index]).catch(() => {
        /* A single stale upstream must not fail the user's whole batch. */
      })
      completed++
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(USER_SYNC_CONCURRENCY, calendars.length) },
      worker,
    ),
  )
  return { started, completed }
}
