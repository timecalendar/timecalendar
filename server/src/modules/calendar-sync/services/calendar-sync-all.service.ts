import { Injectable } from "@nestjs/common"
import dayjs from "dayjs"
import { SyncCalendarsDto } from "modules/calendar-sync/models/dto/sync-calendars.dto"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarService } from "modules/calendar/services/calendar.service"
import pLimit from "p-limit"

const INACTIVITY_DAYS = 14
const UPDATE_AFTER_MIN = 30
const UPDATE_CONCURRENCY = 10

type FindCalendarsToSyncParams = {
  tokens?: string[]
  syncEvenIfInactive?: boolean
}

@Injectable()
export class CalendarSyncAllService {
  constructor(
    private readonly calendarSyncService: CalendarSyncService,
    private readonly calendarRepository: CalendarRepository,
    private readonly calendarService: CalendarService,
  ) {}

  async syncAllForUser({ tokens }: SyncCalendarsDto) {
    const calendars = await this.findCalendarsToSync({
      tokens,
      syncEvenIfInactive: true,
    })
    await this.syncAll(calendars)
    await this.calendarRepository.setCalendarsLastAccessedAt(tokens, new Date())
    return this.calendarService.calendarsForPublic(tokens)
  }

  async syncAllForCronJob() {
    const calendars = await this.findCalendarsToSync()
    await this.syncAll(calendars)
  }

  private async findCalendarsToSync({
    tokens,
    syncEvenIfInactive,
  }: FindCalendarsToSyncParams = {}) {
    return this.calendarRepository.findLastUpdatedBeforeWithContent({
      lastUpdatedBefore: dayjs().subtract(UPDATE_AFTER_MIN, "minutes").toDate(),
      lastAccessedAtAfter: syncEvenIfInactive
        ? undefined
        : dayjs().subtract(INACTIVITY_DAYS, "days").toDate(),
      filterByTokens: tokens,
    })
  }

  private async syncAll(calendars: Calendar[]) {
    const limit = pLimit(UPDATE_CONCURRENCY)
    const input = calendars.map((calendar) =>
      limit(() =>
        this.calendarSyncService.sync(calendar).catch(() => {
          /* ok */
        }),
      ),
    )

    await Promise.all(input)
  }
}
