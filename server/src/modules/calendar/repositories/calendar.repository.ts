import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import {
  DeepPartial,
  EntityNotFoundError,
  In,
  LessThan,
  MoreThan,
  Repository,
} from "typeorm"
import { Calendar } from "modules/calendar/models/calendar.entity"

type FindDueForSyncParams = {
  syncPlannedBefore: Date
  filterByTokens?: string[]
}

type FindDueCalendarIdsParams = {
  syncPlannedBefore: Date
  lastAccessedAtAfter: Date
}

@Injectable()
export class CalendarRepository {
  constructor(
    @InjectRepository(Calendar)
    private readonly repository: Repository<Calendar>,
  ) {}

  async findOne(calendarId: string) {
    const calendar = await this.findOneOrNull(calendarId)
    if (!calendar) throw new EntityNotFoundError(Calendar, { id: calendarId })
    return calendar
  }

  findOneOrNull(calendarId: string) {
    return this.repository.findOne({
      relations: { school: true, content: true },
      where: { id: calendarId },
    })
  }

  // IDs-only projection: the fan-out cron runs against the full calendar table
  // every 5 minutes and must not hydrate content relations (design D2).
  async findDueCalendarIds({
    syncPlannedBefore,
    lastAccessedAtAfter,
  }: FindDueCalendarIdsParams): Promise<string[]> {
    const calendars = await this.repository.find({
      select: { id: true },
      where: {
        syncPlannedAt: LessThan(syncPlannedBefore),
        lastAccessedAt: MoreThan(lastAccessedAtAfter),
      },
      order: { syncPlannedAt: "ASC" },
    })
    return calendars.map(({ id }) => id)
  }

  findOneByToken(token: string) {
    return this.repository.findOneOrFail({
      relations: { school: true },
      where: { token },
    })
  }

  findByIds(calendarIds: string[]) {
    if (calendarIds.length === 0) {
      return Promise.resolve([])
    }
    return this.repository.find({
      relations: { school: true, content: true },
      where: { id: In(calendarIds) },
    })
  }

  update(calendarId: string, calendar: Partial<Calendar>) {
    return this.repository.update({ id: calendarId }, calendar)
  }

  /**
   * Atomically reserves one due calendar before upstream I/O. The same claim
   * timestamp drives both the comparison and the new plan in one statement.
   */
  async claimSyncIfDue(
    calendarId: string,
    minSyncIntervalMinutes: number,
  ): Promise<boolean> {
    const claimTime = new Date()
    const result = await this.repository
      .createQueryBuilder()
      .update(Calendar)
      .set({
        syncPlannedAt: () =>
          "CAST(:claimTime AS timestamp) + make_interval(mins => :minSyncIntervalMinutes)",
      })
      .where(`"id" = :calendarId`, { calendarId })
      .andWhere(`"syncPlannedAt" <= CAST(:claimTime AS timestamp)`)
      .setParameter("claimTime", claimTime)
      .setParameter("minSyncIntervalMinutes", minSyncIntervalMinutes)
      .execute()

    return result.affected === 1
  }

  /** Records a sync attempt without ever shortening its existing reservation. */
  recordSyncAttempt(calendarId: string, minSyncIntervalMinutes: number) {
    const attemptTime = new Date()
    return this.repository
      .createQueryBuilder()
      .update(Calendar)
      .set({
        lastUpdatedAt: () => "CAST(:attemptTime AS timestamp)",
        syncPlannedAt: () =>
          'GREATEST("syncPlannedAt", CAST(:attemptTime AS timestamp) + make_interval(mins => :minSyncIntervalMinutes))',
      })
      .where(`"id" = :calendarId`, { calendarId })
      .setParameter("attemptTime", attemptTime)
      .setParameter("minSyncIntervalMinutes", minSyncIntervalMinutes)
      .execute()
  }

  restoreSyncPlan(calendarId: string, syncPlannedAt: Date) {
    return this.repository.update({ id: calendarId }, { syncPlannedAt })
  }

  save(calendar: DeepPartial<Calendar>) {
    return this.repository.save(calendar)
  }

  findDueForSync({ syncPlannedBefore, filterByTokens }: FindDueForSyncParams) {
    return this.repository.find({
      relations: { school: true },
      where: {
        syncPlannedAt: LessThan(syncPlannedBefore),
        ...(filterByTokens && { token: In(filterByTokens) }),
      },
      order: { syncPlannedAt: "ASC" },
    })
  }

  findByTokensWithContent(tokens: string[]) {
    return this.repository.find({
      relations: { school: true, content: true },
      where: { token: In(tokens) },
      order: { createdAt: "DESC" },
    })
  }

  setCalendarsLastAccessedAt(tokens: string[], lastAccessedAt: Date) {
    return this.repository.update({ token: In(tokens) }, { lastAccessedAt })
  }
}
