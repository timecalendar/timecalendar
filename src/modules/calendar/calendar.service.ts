import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Calendar } from "./models/calendar.entity"

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Calendar)
    private repository: Repository<Calendar>,
  ) {}
}
