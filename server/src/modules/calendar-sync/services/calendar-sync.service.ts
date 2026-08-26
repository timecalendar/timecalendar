import { Injectable, UnprocessableEntityException } from "@nestjs/common"
import { addMinutes } from "date-fns"
import { DetectCalendarChangeService } from "modules/calendar-log/services/detect-calendar-change.service"
import { CreateCalendarRepDto } from "modules/calendar-sync/models/dto/create-calendar-rep.dto"
import { CreateCalendarDto } from "modules/calendar-sync/models/dto/create-calendar.dto"
import { CalendarFailureRepository } from "modules/calendar-sync/repositories/calendar-failure.repository"
import { withCalendarSyncSpan } from "modules/calendar-sync/calendar-sync-tracing"
import {
  CalendarSyncContext,
  isCalendarSyncAbort,
  throwIfCalendarSyncAborted,
} from "modules/calendar-sync/models/calendar-sync-context"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { DEFAULT_MIN_SYNC_INTERVAL_MINUTES } from "modules/fetch/constants"
import { CalendarSource } from "modules/fetch/models/calendar-source"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { toErrorType } from "modules/shared/utils/to-error-type"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { SubjectService } from "modules/subject/services/subject.service"
import { nanoid } from "nanoid"
import { CalendarSyncMetricsService } from "./calendar-sync-metrics.service"

type CalendarForSync = Pick<Calendar, "url" | "customData"> &
  Partial<Omit<Calendar, "url">>

@Injectable()
export class CalendarSyncService {
  constructor(
    private readonly fetchService: FetchService,
    private readonly schoolRepository: SchoolRepository,
    private readonly calendarRepository: CalendarRepository,
    private readonly calendarContentRepository: CalendarContentRepository,
    private readonly calendarEventHelper: CalendarEventHelper,
    private readonly subjectService: SubjectService,
    private readonly calendarFailureRepository: CalendarFailureRepository,
    private readonly calendarSyncMetricsService: CalendarSyncMetricsService,
    private readonly detectCalendarChangeService: DetectCalendarChangeService,
  ) {}

  async createCalendar(body: CreateCalendarDto): Promise<CreateCalendarRepDto> {
    const { url, schoolId, schoolName, customData, name } = body

    // Both timestamps are placeholders overwritten by `saveCalendar` at the end
    // of this same sync. `syncPlannedAt` has to be one of them: without it the
    // insert takes the column's `now()` default and the row is briefly due,
    // which would let a concurrent request fetch a brand-new calendar twice.
    const now = new Date()
    const calendar = await this.sync({
      token: nanoid(),
      school: schoolId ? idToEntity(schoolId) : undefined,
      schoolName: schoolId ? null : schoolName,
      url,
      customData,
      name,
      lastUpdatedAt: now,
      syncPlannedAt: addMinutes(now, DEFAULT_MIN_SYNC_INTERVAL_MINUTES),
    })

    return { token: calendar.token }
  }

  async sync(calendar: CalendarForSync, context: CalendarSyncContext = {}) {
    const { id, url, customData, school } = calendar
    throwIfCalendarSyncAborted(context.signal)
    const source = { url, customData }
    const code = await this.findSchoolCode(school?.id)
    const minSyncIntervalMinutes = this.fetchService.getMinSyncIntervalMinutes(
      source,
      code,
    )
    const isNewCalendar = !id
    if (id && !calendar.syncPlannedAt) {
      throw new Error("Existing calendar sync requires syncPlannedAt metadata")
    }
    const originalSyncPlannedAt = calendar.syncPlannedAt
    const claimed =
      id &&
      (await this.calendarRepository.claimSyncIfDue(id, minSyncIntervalMinutes))
    if (id && !claimed) {
      return this.calendarRepository.findOne(id)
    }

    let fetchedEvents: Awaited<ReturnType<CalendarSyncService["fetchEvents"]>>
    try {
      this.calendarSyncMetricsService.upstreamStarted()
      try {
        fetchedEvents = await this.fetchEvents(source, code, {
          ...context,
          onAttempt: () => this.calendarSyncMetricsService.recordAttempt(),
        })
      } finally {
        this.calendarSyncMetricsService.upstreamCompleted()
      }
      throwIfCalendarSyncAborted(context.signal)
    } catch (error) {
      if (
        id &&
        claimed &&
        originalSyncPlannedAt &&
        isCalendarSyncAbort(error, context.signal)
      ) {
        await this.calendarRepository.restoreSyncPlan(id, originalSyncPlannedAt)
      }
      throw error
    }

    const isError = !fetchedEvents.ok

    this.calendarSyncMetricsService.calendarSyncCounter.add(1, {
      school: code ?? undefined,
      status: isError ? "error" : "success",
      error_type: !fetchedEvents.ok
        ? toErrorType(fetchedEvents.error)
        : undefined,
      action: isNewCalendar ? "create" : "update",
    })

    if (!fetchedEvents.ok && isNewCalendar) {
      const error = fetchedEvents.error

      const serializedError = {
        name: error?.name ?? null,
        message: error?.message ?? null,
        stack: error?.stack ?? null,
        error: error?.error ?? null,
      }

      await this.calendarFailureRepository.create(
        url,
        JSON.stringify(
          Object.fromEntries(
            Object.entries(serializedError).filter(([, v]) => v != null),
          ),
        ),
      )
      throw fetchedEvents.error
    }

    let savedCalendar: Calendar
    try {
      savedCalendar = await withCalendarSyncSpan(
        "calendar_sync.diff_persist",
        () =>
          this.calendarSyncMetricsService.measurePhase("diff_persist", () =>
            this.saveCalendar(
              calendar,
              fetchedEvents.ok ? fetchedEvents.events : undefined,
              minSyncIntervalMinutes,
              context.signal,
            ),
          ),
      )
    } catch (error) {
      if (
        id &&
        claimed &&
        originalSyncPlannedAt &&
        isCalendarSyncAbort(error, context.signal)
      ) {
        await this.calendarRepository.restoreSyncPlan(id, originalSyncPlannedAt)
      }
      throw error
    }
    if (!fetchedEvents.ok) throw fetchedEvents.error

    return savedCalendar
  }

  private async saveCalendar(
    calendar: CalendarForSync,
    events: CalendarEvent[] | undefined,
    minSyncIntervalMinutes: number,
    signal?: AbortSignal,
  ) {
    let { id: calendarId } = calendar
    const isUpdate = !!calendarId

    const savedCalendar = await this.calendarRepository.save({
      ...(calendarId ? idToEntity(calendarId) : calendar),
      content: undefined, // content is set just after
    })
    calendarId = savedCalendar.id

    if (events) {
      // There is no asynchronous boundary between this gate and transaction
      // entry. Once invoked, the content and CalendarLog transaction settles.
      throwIfCalendarSyncAborted(signal)
      // Content + its CalendarLog commit together (design D4): a crash between
      // the two can no longer lose a detected change, and a job retry re-diffs
      // old-vs-new because the old content was not overwritten.
      await this.calendarContentRepository.saveWithTransaction(
        calendarId,
        { events },
        async (manager, previousContent) => {
          if (isUpdate) {
            await this.detectCalendarChangeService.detectAndLogChanges(
              manager,
              savedCalendar.id,
              previousContent?.events ?? [],
              events,
            )
          }
        },
      )
      await this.subjectService.syncEventSubjects(calendarId, events)
    }

    // Also written when the fetch failed: a university that is down must not be
    // retried on every client request.
    await this.calendarRepository.recordSyncAttempt(
      calendarId,
      minSyncIntervalMinutes,
    )

    return this.calendarRepository.findOne(calendarId)
  }

  private async fetchEvents(
    source: CalendarSource,
    code: string | null,
    context: CalendarSyncContext,
  ): Promise<
    { ok: false; error: any } | { ok: true; events: CalendarEvent[] }
  > {
    try {
      const fetchedEvents = await this.fetchService.fetchEvents(
        source,
        code,
        undefined,
        context,
      )
      if (fetchedEvents.length === 0)
        throw new UnprocessableEntityException("No events found")

      return {
        ok: true,
        events: fetchedEvents.map((event) =>
          this.calendarEventHelper.fromFetcherCalendarEvent(event),
        ),
      }
    } catch (err) {
      if (isCalendarSyncAbort(err, context.signal)) throw err
      return { ok: false, error: err }
    }
  }

  private async findSchoolCode(schoolId?: string) {
    if (!schoolId) return null
    const school = await this.schoolRepository.findOneOrFail(schoolId)
    return school.code
  }
}
