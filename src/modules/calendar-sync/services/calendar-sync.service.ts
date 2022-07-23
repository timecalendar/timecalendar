import { Injectable, NotFoundException } from "@nestjs/common"
import { CreateCalendarRepDto } from "modules/calendar-sync/dto/create-calendar-rep.dto"
import { CreateCalendarDto } from "modules/calendar-sync/dto/create-calendar.dto"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarContentRepository } from "modules/calendar/repositories/calendar-content.repository"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"

@Injectable()
export class CalendarSyncService {
  constructor(
    private readonly fetchService: FetchService,
    private readonly schoolRepository: SchoolRepository,
    private readonly calendarRepository: CalendarRepository,
    private readonly calendarContentRepository: CalendarContentRepository,
  ) {}

  async create(body: CreateCalendarDto): Promise<CreateCalendarRepDto> {
    const { url, schoolId, schoolName, customData, name } = body

    const source = { url, customData }
    const code = await this.findSchoolCode(schoolId)
    const events = await this.fetchService.fetchEvents(source, code)
    if (events.length === 0) throw new NotFoundException("No events found")

    const calendar = await this.sync({
      school: schoolId ? idToEntity(schoolId) : null,
      schoolName: schoolId ? null : schoolName,
      url,
      customData,
      name,
      lastUpdatedAt: new Date(),
    })

    return { id: calendar.id }
  }

  async sync(calendar: Partial<Calendar>) {
    const { id, url, customData, schoolId } = calendar
    const source = { url, customData }
    const code = await this.findSchoolCode(schoolId)
    const events = await this.fetchService.fetchEvents(source, code)
    if (events.length === 0) throw new NotFoundException("No events found")

    const fieldsToUpdate = { lastUpdatedAt: new Date() }
    const savedCalendar = await this.calendarRepository.save({
      ...(id ? { id } : calendar),
      ...fieldsToUpdate,
    })

    await this.calendarContentRepository.save({
      calendar: { id: savedCalendar.id },
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
