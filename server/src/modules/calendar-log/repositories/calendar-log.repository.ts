import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeepPartial, Repository, In } from "typeorm"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"

@Injectable()
export class CalendarLogRepository {
  constructor(
    @InjectRepository(CalendarLog)
    private readonly repository: Repository<CalendarLog>,
  ) {}

  save(calendarLog: DeepPartial<CalendarLog>) {
    return this.repository.save(calendarLog)
  }

  findByCalendarId(calendarId: string) {
    return this.repository.find({
      relations: { calendar: true },
      where: { calendar: { id: calendarId } },
      order: { createdAt: "DESC" },
    })
  }

  findByCalendarTokens(tokens: string[]) {
    return this.repository.find({
      relations: { calendar: true },
      where: { calendar: { token: In(tokens) } },
      order: { createdAt: "DESC" },
    })
  }
}
