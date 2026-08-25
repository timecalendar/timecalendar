import { Injectable } from "@nestjs/common"
import { SyncCalendarsDto } from "modules/calendar-sync/models/dto/sync-calendars.dto"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarService } from "modules/calendar/services/calendar.service"

@Injectable()
export class CalendarSyncAllService {
  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly calendarRepository: CalendarRepository,
    private readonly calendarService: CalendarService,
  ) {}

  async syncAllForUser({ tokens }: SyncCalendarsDto) {
    const calendars = await this.calendarRepository.findDueForSyncWithContent({
      syncPlannedBefore: new Date(),
      filterByTokens: tokens,
    })
    await Promise.all(
      calendars.map((calendar) =>
        this.calendarSyncService.sync(calendar).catch(() => {
          /* ok */
        }),
      ),
    )
    await this.calendarRepository.setCalendarsLastAccessedAt(tokens, new Date())
    return this.calendarService.findCalendarsForPublic(tokens)
  }
}
