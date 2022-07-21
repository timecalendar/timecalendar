import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DeepPartial, Repository } from "typeorm"
import { Calendar } from "modules/calendar/models/calendar.entity"

@Injectable()
export class CalendarRepository {
  constructor(
    @InjectRepository(Calendar)
    private readonly repository: Repository<Calendar>,
  ) {}

  create(calendar: DeepPartial<Calendar>) {
    return this.repository.save(calendar)
  }
}
