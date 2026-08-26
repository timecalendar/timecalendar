import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarFailure } from "modules/calendar-sync/models/calendar-failure.entity"
import { CalendarImportDiagnostic } from "modules/calendar-sync/recovery/calendar-import-recovery"
import { Repository } from "typeorm"

@Injectable()
export class CalendarFailureRepository {
  constructor(
    @InjectRepository(CalendarFailure)
    private readonly repository: Repository<CalendarFailure>,
  ) {}

  create(diagnostic: CalendarImportDiagnostic) {
    return this.repository.save(diagnostic)
  }
}
