import { Injectable } from "@nestjs/common"
import {
  CalendarContentEventEmitter,
  CalendarContentUpdatedParams,
} from "modules/calendar-event-emitter/events/calendar-content.event-emitter"
import { calendarChangeIsEmpty } from "modules/calendar-log/models/calendar-change.model"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { FindCalendarChangeService } from "modules/calendar-log/services/find-calendar-change.service"

@Injectable()
export class CalendarLogService {
  constructor(
    private readonly findCalendarChangeService: FindCalendarChangeService,
    private readonly calendarContentEventEmitter: CalendarContentEventEmitter,
    private readonly calendarLogRepository: CalendarLogRepository,
  ) {
    this.calendarContentEventEmitter.on("calendarContentUpdated", (params) =>
      this.onCalendarContentChanged(params),
    )
  }

  async onCalendarContentChanged({
    calendarId,
    oldCalendarEvents,
    newCalendarEvents,
  }: CalendarContentUpdatedParams) {
    const calendarChange = this.findCalendarChangeService.run({
      oldCalendarEvents,
      newCalendarEvents,
    })
    if (calendarChangeIsEmpty(calendarChange)) return

    await this.calendarLogRepository.createForCalendar({
      calendarId,
      calendarChange,
    })
  }
}
