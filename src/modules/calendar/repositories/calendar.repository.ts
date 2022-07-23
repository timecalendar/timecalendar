import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeepPartial, In, Repository } from "typeorm"
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

  findByIdsWithContent(ids: string[]) {
    return this.repository.find({
      relations: { school: true, content: true },
      where: { id: In(ids) },
      order: { createdAt: "DESC" },
    })
  }
}
