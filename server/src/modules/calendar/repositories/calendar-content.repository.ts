import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { DeepPartial, EntityManager, Repository } from "typeorm"

@Injectable()
export class CalendarContentRepository {
  constructor(
    @InjectRepository(CalendarContent)
    private readonly repository: Repository<CalendarContent>,
  ) {}

  // Saves the content and runs `inSameTransaction` in the same transaction, so
  // callers can commit dependent rows (e.g. the CalendarLog change record)
  // atomically with the content they describe. The existing row is read with a
  // pessimistic write lock: two concurrent syncs of the same calendar
  // serialize, so the second one re-diffs against the committed content
  // instead of logging a duplicate change.
  async saveWithTransaction(
    calendarId: string,
    calendarContent: DeepPartial<CalendarContent>,
    inSameTransaction: (
      manager: EntityManager,
      previousContent: CalendarContent | null,
    ) => Promise<void>,
  ) {
    return this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(CalendarContent)
      const previousContent = await repository
        .createQueryBuilder("content")
        .setLock("pessimistic_write")
        .where("content.calendarId = :calendarId", { calendarId })
        .getOne()
      const saved = await repository.save({
        id: previousContent?.id,
        ...calendarContent,
        calendar: idToEntity<CalendarContent>(calendarId),
      })
      await inSameTransaction(manager, previousContent)
      return saved
    })
  }

  async findByCalendarId(calendarId: string) {
    return this.repository.findOneBy({
      calendar: idToEntity(calendarId),
    })
  }
}
