import { Injectable } from "@nestjs/common"
import dayjs from "lib/dayjs"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import pLimit from "p-limit"

const UPDATE_AFTER_MIN = 15
const UPDATE_CONCURRENCY = 10

@Injectable()
export class CalendarSyncAllService {
  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly calendarRepository: CalendarRepository,
  ) {}

  async syncAll() {
    const calendarsToUpdate =
      await this.calendarRepository.findLastUpdatedBeforeWithContent(
        dayjs().subtract(UPDATE_AFTER_MIN, "minutes").toDate(),
      )

    const limit = pLimit(UPDATE_CONCURRENCY)
    const input = calendarsToUpdate.map((calendar) =>
      limit(() => this.calendarSyncService.sync(calendar)),
    )

    await Promise.all(input)
  }
}
