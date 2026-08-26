import { Injectable } from "@nestjs/common"
import { addMinutes } from "date-fns"
import { DetectCalendarChangeService } from "modules/calendar-log/services/detect-calendar-change.service"
import { CreateCalendarRepDto } from "modules/calendar-sync/models/dto/create-calendar-rep.dto"
import { CreateCalendarDto } from "modules/calendar-sync/models/dto/create-calendar.dto"
import { CalendarFailureRepository } from "modules/calendar-sync/repositories/calendar-failure.repository"
import { CalendarImportException } from "modules/calendar-sync/recovery/calendar-import.exception"
import {
  CalendarImportDiagnostic,
  classifyCalendarImport,
} from "modules/calendar-sync/recovery/calendar-import-recovery"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { DEFAULT_MIN_SYNC_INTERVAL_MINUTES } from "modules/fetch/constants"
import { CalendarSource } from "modules/fetch/models/calendar-source"
import { CalendarFetchError } from "modules/fetch/models/calendar-fetch-outcome"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SchoolRepository } from "modules/school/repositories/school.repository"
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

  async sync(calendar: CalendarForSync) {
    const { id, url, customData, school } = calendar
    const source = { url, customData }
    const code = await this.findSchoolCode(school?.id)
    const isNewCalendar = !id
    const preflight = classifyCalendarImport({
      sourceUrl: url,
      schoolCode: code,
    })
    if (preflight) {
      await this.recordFailure(preflight, isNewCalendar)
      throw new CalendarImportException(preflight)
    }

    const minSyncIntervalMinutes = this.fetchService.getMinSyncIntervalMinutes(
      source,
      code,
    )
    if (
      id &&
      !(await this.calendarRepository.claimSyncIfDue(
        id,
        minSyncIntervalMinutes,
      ))
    ) {
      return this.calendarRepository.findOne(id)
    }

    const fetchedEvents = await this.fetchEvents(source, code)

    const isError = "error" in fetchedEvents

    this.calendarSyncMetricsService.calendarSyncCounter.add(1, {
      school: code ?? undefined,
      status: isError ? "error" : "success",
      classification: isError
        ? fetchedEvents.diagnostic.classification
        : undefined,
      help_key: isError ? fetchedEvents.diagnostic.helpKey : undefined,
      error_kind: isError ? fetchedEvents.diagnostic.errorKind : undefined,
      action: isNewCalendar ? "create" : "update",
    })

    if (isError && isNewCalendar) {
      await this.calendarFailureRepository.create(fetchedEvents.diagnostic)
      throw new CalendarImportException(fetchedEvents.diagnostic)
    }

    const savedCalendar = await this.saveCalendar(
      calendar,
      fetchedEvents.events,
      minSyncIntervalMinutes,
    )
    if (isError) throw fetchedEvents.error

    return savedCalendar
  }

  private async saveCalendar(
    calendar: CalendarForSync,
    events: CalendarEvent[] | undefined,
    minSyncIntervalMinutes: number,
  ) {
    let { id: calendarId } = calendar
    const isUpdate = !!calendarId

    const savedCalendar = await this.calendarRepository.save({
      ...(calendarId ? idToEntity(calendarId) : calendar),
      content: undefined, // content is set just after
    })
    calendarId = savedCalendar.id

    if (events) {
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
  ): Promise<
    | {
        error: unknown
        diagnostic: CalendarImportDiagnostic
        events: undefined
      }
    | { events: CalendarEvent[] }
  > {
    try {
      const fetchedEvents = await this.fetchService.fetchEvents(source, code)
      if (fetchedEvents.length === 0) {
        throw new CalendarFetchError("empty_calendar")
      }

      return {
        events: fetchedEvents.map((event) =>
          this.calendarEventHelper.fromFetcherCalendarEvent(event),
        ),
      }
    } catch (err) {
      const outcome =
        err instanceof CalendarFetchError ? err.kind : ("unknown" as const)
      const diagnostic = classifyCalendarImport({
        sourceUrl: source.url,
        schoolCode: code,
        outcome,
      })
      if (!diagnostic) throw new Error("Missing calendar import diagnostic")
      return { error: err, diagnostic, events: undefined }
    }
  }

  private async findSchoolCode(schoolId?: string) {
    if (!schoolId) return null
    const school = await this.schoolRepository.findOneOrFail(schoolId)
    return school.code
  }

  private async recordFailure(
    diagnostic: CalendarImportDiagnostic,
    isNewCalendar: boolean,
  ) {
    this.calendarSyncMetricsService.calendarSyncCounter.add(1, {
      school: diagnostic.schoolCode ?? undefined,
      status: "error",
      classification: diagnostic.classification,
      help_key: diagnostic.helpKey,
      error_kind: diagnostic.errorKind,
      action: isNewCalendar ? "create" : "update",
    })
    if (isNewCalendar) {
      await this.calendarFailureRepository.create(diagnostic)
    }
  }
}
