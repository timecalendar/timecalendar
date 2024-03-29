import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeepPartial, In, LessThan, Repository } from "typeorm"
import { Calendar } from "modules/calendar/models/calendar.entity"

@Injectable()
export class CalendarRepository {
  constructor(
    @InjectRepository(Calendar)
    private readonly repository: Repository<Calendar>,
  ) {}

  findOne(calendarId: string) {
    return this.repository.findOneOrFail({
      relations: { school: true },
      where: { id: calendarId },
    })
  }

  findOneByToken(token: string) {
    return this.repository.findOneOrFail({
      relations: { school: true },
      where: { token },
    })
  }

  update(calendarId: string, calendar: DeepPartial<Calendar>) {
    return this.repository.update({ id: calendarId }, calendar)
  }

  save(calendar: DeepPartial<Calendar>) {
    return this.repository.save(calendar)
  }

  findLastUpdatedBeforeWithContent(
    lastUpdatedBefore: Date,
    filterByTokens?: string[],
  ) {
    return this.repository.find({
      relations: { school: true, content: true },
      where: {
        lastUpdatedAt: LessThan(lastUpdatedBefore),
        ...(filterByTokens && { token: In(filterByTokens) }),
      },
      order: { lastUpdatedAt: "ASC" },
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
