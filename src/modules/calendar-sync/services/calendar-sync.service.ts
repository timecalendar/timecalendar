import { Injectable, NotFoundException } from "@nestjs/common"
import { CreateCalendarRepDto } from "modules/calendar-sync/models/dto/create-calendar-rep.dto"
import { CreateCalendarDto } from "modules/calendar-sync/models/dto/create-calendar.dto"
import { SyncCalendarsDto } from "modules/calendar-sync/models/dto/sync-calendars.dto"
import { CalendarEventHelper } from "modules/calendar/helpers/calendar-event.helper"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarService } from "modules/calendar/services/calendar.service"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { nanoid } from "nanoid"

@Injectable()
export class CalendarSyncService {
  constructor(
    private readonly fetchService: FetchService,
    private readonly schoolRepository: SchoolRepository,
    private readonly calendarRepository: CalendarRepository,
    private readonly calendarContentRepository: CalendarContentRepository,
    private readonly calendarEventHelper: CalendarEventHelper,
    private readonly calendarService: CalendarService,
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

  async syncCalendars({ tokens }: SyncCalendarsDto) {
    const calendars = await this.calendarRepository.findByTokensWithContent(
      tokens,
    )

    await Promise.all(
      calendars.map((calendar) =>
        this.sync(calendar).catch(() => {
          // nothing for now
        }),
      ),
    )

    return this.calendarService.calendarsForPublic(
      calendars.map(({ token }) => token),
    )
  }

  async sync(
    calendar: Pick<Calendar, "url" | "customData"> &
      Partial<Omit<Calendar, "url">>,
  ) {
    const { id, url, customData, schoolId } = calendar
    const source = { url, customData }
    const code = await this.findSchoolCode(schoolId)
    const fetchedEvents = await this.fetchService.fetchEvents(source, code)
    if (fetchedEvents.length === 0)
      throw new NotFoundException("No events found")

    const fieldsToUpdate = { lastUpdatedAt: new Date() }
    const events = fetchedEvents.map((event) =>
      this.calendarEventHelper.fromFetcherCalendarEvent(event),
    )

    const savedCalendar = await this.calendarRepository.save({
      ...(id ? idToEntity(id) : calendar),
      ...fieldsToUpdate,
      content: undefined, // content is set just after
    })
    await this.calendarContentRepository.save(savedCalendar.id, {
      events,
    })

    return savedCalendar
  }

  private async findSchoolCode(schoolId?: string) {
    if (!schoolId) return null
    const school = await this.schoolRepository.findOne(schoolId)
    if (!school) throw new NotFoundException("School not found")
    return school.code
  }
}
