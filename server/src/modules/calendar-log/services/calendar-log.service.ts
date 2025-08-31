import { Injectable } from "@nestjs/common"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { CalendarLogMapper } from "modules/calendar-log/mappers/calendar-log.mapper"
import { GetCalendarLogsDto } from "modules/calendar-log/models/dto/get-calendar-logs.dto"
import { CalendarLogGet } from "modules/calendar-log/models/dto/calendar-log-get.dto"

@Injectable()
export class CalendarLogService {
  constructor(
    private readonly repository: CalendarLogRepository,
    private readonly mapper: CalendarLogMapper,
  ) {}

  async getCalendarLogs(
    payload: GetCalendarLogsDto,
  ): Promise<CalendarLogGet[]> {
    const logs = await this.repository.findByCalendarTokens(payload.tokens)
    return logs.map((log) => this.mapper.toCalendarLogGet(log))
  }
}
