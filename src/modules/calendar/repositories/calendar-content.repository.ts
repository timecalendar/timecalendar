import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { DeepPartial, Repository } from "typeorm"

@Injectable()
export class CalendarContentRepository {
  constructor(
    @InjectRepository(CalendarContent)
    private readonly repository: Repository<CalendarContent>,
  ) {}

  save(calendarContent: DeepPartial<CalendarContent>) {
    return this.repository.save(calendarContent)
  }
}
