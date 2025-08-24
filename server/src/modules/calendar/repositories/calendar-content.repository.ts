import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { DeepPartial, Repository } from "typeorm"

@Injectable()
export class CalendarContentRepository {
  constructor(
    @InjectRepository(CalendarContent)
    private readonly repository: Repository<CalendarContent>,
  ) {}

  async save(
    calendarId: string,
    calendarContent: DeepPartial<CalendarContent>,
  ) {
    const existing = await this.repository.findOneBy({
      calendar: idToEntity(calendarId),
    })
    const calendarContentId = existing?.id
    return this.repository.save({
      id: calendarContentId,
      ...calendarContent,
      calendar: idToEntity<CalendarContent>(calendarId),
    })
  }

  async findByCalendarId(calendarId: string) {
    return this.repository.findOneBy({
      calendar: idToEntity(calendarId),
    })
  }
}
