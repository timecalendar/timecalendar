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

  // Bounded batches keep each DELETE's lock footprint and WAL burst small.
  async pruneOlderThan(cutoff: Date, batchSize: number): Promise<number> {
    let total = 0
    let deleted: number
    do {
      // postgres driver returns [rows, rowCount] for DELETE … RETURNING
      const [rows]: [{ id: string }[], number] = await this.repository.query(
        `DELETE FROM "calendar_log" WHERE "id" IN (
           SELECT "id" FROM "calendar_log" WHERE "createdAt" < $1 LIMIT $2
         ) RETURNING "id"`,
        [cutoff, batchSize],
      )
      deleted = rows.length
      total += deleted
    } while (deleted === batchSize)
    return total
  }
}
