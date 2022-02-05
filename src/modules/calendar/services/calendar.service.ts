import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { Repository } from "typeorm"

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private repository: Repository<Calendar>,
  ) {}
}
