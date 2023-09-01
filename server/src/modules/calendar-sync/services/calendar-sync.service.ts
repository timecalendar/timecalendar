import { Injectable, NotFoundException } from "@nestjs/common"
import { CreateCalendarRepDto } from "modules/calendar-sync/models/dto/create-calendar-rep.dto"
import { CreateCalendarDto } from "modules/calendar-sync/models/dto/create-calendar.dto"
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
  ) {}

  async createCalendar(body: CreateCalendarDto): Promise<CreateCalendarRepDto> {
    const { url, schoolId, schoolName, customData, name } = body

    const source = { url, customData }
    const code = await this.findSchoolCode(schoolId)
    const events = await this.fetchService.fetchEvents(source, code)
    if (events.length === 0) throw new NotFoundException("No events found")

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
    const { id, url, customData, schoolId } = calendar
    const source = { url, customData }
    const code = await this.findSchoolCode(schoolId)
    const fetchedEvents = await this.fetchEvents(source, code)

    const isError = "error" in fetchedEvents

    if (isError && !id) throw fetchedEvents.error
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

    const savedCalendar = await this.calendarRepository.save({
      ...(calendarId ? idToEntity(calendarId) : calendar),
      content: undefined, // content is set just after
    })
    calendarId = savedCalendar.id

    if (events) {
      await this.calendarContentRepository.save(calendarId, { events })
      await this.subjectService.syncEventSubjects(calendarId, events)
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
        throw new NotFoundException("No events found")

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
    if (!school) throw new NotFoundException("School not found")
    return school.code
  }
}
