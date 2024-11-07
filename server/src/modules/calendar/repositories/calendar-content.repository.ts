import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { CalendarContentEventEmitter } from "modules/calendar-event-emitter/events/calendar-content.event-emitter"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { Repository } from "typeorm"

@Injectable()
export class CalendarContentRepository {
  constructor(
    @InjectRepository(CalendarContent)
    private readonly repository: Repository<CalendarContent>,
    private readonly calendarContentEventEmitter: CalendarContentEventEmitter,
  ) {}

  async save(calendarId: string, { events }: Pick<CalendarContent, "events">) {
    const existing = await this.repository.findOneBy({
      calendar: idToEntity(calendarId),
    })

    const calendarContentId = existing?.id

    if (existing !== null) {
      await this.calendarContentEventEmitter.emit("calendarContentUpdated", {
        calendarId,
        oldCalendarEvents: existing.events,
        newCalendarEvents: events,
      })
    }

    return this.repository.save({
      id: calendarContentId,
      events,
      calendar: idToEntity<CalendarContent>(calendarId),
    })
  }
}
