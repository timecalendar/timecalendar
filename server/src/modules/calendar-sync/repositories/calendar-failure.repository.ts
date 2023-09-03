import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { Repository } from "typeorm"

@Injectable()
export class CalendarFailureRepository {
  constructor(
    @InjectRepository(CalendarFailure)
    private readonly repository: Repository<CalendarFailure>,
  ) {}

  create(url: string, error: string) {
    return this.repository.save({ url, error })
  }
}
