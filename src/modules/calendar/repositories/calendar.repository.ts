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

  save(calendar: DeepPartial<Calendar>) {
    return this.repository.save(calendar)
  }

  findLastUpdatedBeforeWithContent(lastUpdatedBefore: Date) {
    return this.repository.find({
      relations: { school: true, content: true },
      where: { lastUpdatedAt: LessThan(lastUpdatedBefore) },
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
}
