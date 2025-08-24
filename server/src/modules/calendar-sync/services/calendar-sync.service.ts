import { Injectable, UnprocessableEntityException } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { CreateCalendarRepDto } from "modules/calendar-sync/models/dto/create-calendar-rep.dto"
import { CreateCalendarDto } from "modules/calendar-sync/models/dto/create-calendar.dto"
import { CalendarContentUpdatedEvent } from "modules/calendar-sync/events/calendar-content-updated.event"
import { CalendarFailureRepository } from "modules/calendar-sync/repositories/calendar-failure.repository"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarSource } from "modules/fetch/models/calendar-source"
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createCalendar(body: CreateCalendarDto): Promise<CreateCalendarRepDto> {
    const { url, schoolId, schoolName, customData, name } = body

    const calendar = await this.sync({
      token: nanoid(),
      school: schoolId ? idToEntity(schoolId) : undefined,
      schoolName: schoolId ? null : schoolName,
      url,
      customData,
      name,
      lastUpdatedAt: new Date(),
    })

    return { token: calendar.token }
  }

  async sync(calendar: CalendarForSync) {
    const { id, url, customData, school } = calendar
    const source = { url, customData }
    const code = await this.findSchoolCode(school?.id)
    const fetchedEvents = await this.fetchEvents(source, code)

    const isError = "error" in fetchedEvents
    const isNewCalendar = !id

    this.calendarSyncMetricsService.calendarSyncCounter.add(1, {
      school: code ?? undefined,
      domain: this.parseDomain(url),
      status: isError ? "error" : "success",
      error: isError ? fetchedEvents.error?.message : undefined,
      action: isNewCalendar ? "create" : "update",
    })

    if (isError && isNewCalendar) {
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

    const savedCalendar = await this.saveCalendar(
      calendar,
      fetchedEvents.events,
    )
    if (isError) throw fetchedEvents.error

    return savedCalendar
  }

  private async saveCalendar(
    calendar: CalendarForSync,
    events: CalendarEvent[] | undefined,
  ) {
    let { id: calendarId } = calendar
    const isUpdate = !!calendarId

    // Get old events before updating (only for existing calendars)
    let oldEvents: CalendarEvent[] = []
    if (isUpdate && events && calendarId) {
      const existingContent =
        await this.calendarContentRepository.findByCalendarId(calendarId)
      oldEvents = existingContent?.events ?? []
    }

    const savedCalendar = await this.calendarRepository.save({
      ...(calendarId ? idToEntity(calendarId) : calendar),
      content: undefined, // content is set just after
    })
    calendarId = savedCalendar.id

    if (events) {
      await this.calendarContentRepository.save(calendarId, { events })
      await this.subjectService.syncEventSubjects(calendarId, events)

      // Emit event only for updates (not creation)
      if (isUpdate) {
        this.eventEmitter.emitAsync(
          "calendar.content.updated",
          new CalendarContentUpdatedEvent(calendarId, oldEvents, events),
        )
      }
    }

    await this.calendarRepository.update(calendarId, {
      lastUpdatedAt: new Date(),
    })

    return this.calendarRepository.findOne(calendarId)
  }

  private async fetchEvents(
    source: CalendarSource,
    code: string | null,
  ): Promise<{ error: any; events: undefined } | { events: CalendarEvent[] }> {
    try {
      const fetchedEvents = await this.fetchService.fetchEvents(source, code)
      if (fetchedEvents.length === 0)
        throw new UnprocessableEntityException("No events found")

      return {
        events: fetchedEvents.map((event) =>
          this.calendarEventHelper.fromFetcherCalendarEvent(event),
        ),
      }
    } catch (err) {
      return { error: err, events: undefined }
    }
  }

  private async findSchoolCode(schoolId?: string) {
    if (!schoolId) return null
    const school = await this.schoolRepository.findOneOrFail(schoolId)
    return school.code
  }

  private parseDomain(url: string) {
    try {
      return new URL(url).hostname
    } catch {
      return undefined
    }
  }
}
