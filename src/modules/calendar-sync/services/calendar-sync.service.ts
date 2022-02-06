import { Injectable } from "@nestjs/common"
import { CreateCalendarDto } from "modules/calendar-sync/dto/create-calendar.dto"

@Injectable()
export class CalendarSyncService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(_body: CreateCalendarDto) {
    // pb
  }
}
