import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { Repository } from "typeorm"

type CreateForCalendarParams = { calendarId: string } & Pick<
  CalendarLog,
  "calendarChange"
>

@Injectable()
export class CalendarLogRepository {
  constructor(
    @InjectRepository(CalendarLog)
    private readonly repository: Repository<CalendarLog>,
  ) {}

  async createForCalendar({
    calendarChange,
    calendarId,
  }: CreateForCalendarParams) {
    return this.repository.save({
      calendar: { id: calendarId },
      calendarChange,
    })
  }
}
