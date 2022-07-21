import { Injectable, NotFoundException } from "@nestjs/common"
import { CreateCalendarDto } from "modules/calendar-sync/dto/create-calendar.dto"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SchoolRepository } from "modules/school/repositories/school.repository"

@Injectable()
export class CalendarSyncService {
  constructor(
    private readonly fetchService: FetchService,
    private readonly schoolRepository: SchoolRepository,
    private readonly calendarRepository: CalendarRepository,
  ) {}

  async create(body: CreateCalendarDto) {
    const { url, schoolId, schoolName, customData, name } = body

    const source = { url, customData }
    const code = await this.findSchoolCode(schoolId)
    const events = await this.fetchService.fetchEvents(source, code)
    if (events.length === 0) throw new NotFoundException("No events found")

    const calendar = await this.calendarRepository.create({
      school: schoolId ? { id: schoolId } : null,
      schoolName: schoolId ? null : schoolName,
      url,
      customData,
      name,
      lastUpdatedAt: new Date(),
    })

    return calendar
  }

  // async sync(calendar: Calendar) {}

  private async findSchoolCode(schoolId?: string) {
    if (!schoolId) return null
    const school = await this.schoolRepository.findOne(schoolId)
    if (!school) throw new NotFoundException("School not found")
    return school.code
  }
}
