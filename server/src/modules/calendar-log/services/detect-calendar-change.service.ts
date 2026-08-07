import { Injectable } from "@nestjs/common"
import { findEventChanges } from "modules/calendar-log/models/change-detection/find-event-changes"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { EntityManager } from "typeorm"

@Injectable()
export class DetectCalendarChangeService {
  // Takes the caller's EntityManager so the CalendarLog row commits in the same
  // transaction as the calendar content it describes (design D4).
  async detectAndLogChanges(
    manager: EntityManager,
    calendarId: string,
    oldEvents: CalendarEvent[],
    newEvents: CalendarEvent[],
  ) {
    const referenceDate = new Date()
    const changes = findEventChanges(referenceDate, oldEvents, newEvents)

    if (this.hasChanges(changes)) {
      await this.saveCalendarLog(manager, calendarId, changes)
    }
  }

  private hasChanges(changes: CalendarChange): boolean {
    return (
      changes.oldItems.length > 0 ||
      changes.newItems.length > 0 ||
      changes.changedItems.length > 0
    )
  }

  private async saveCalendarLog(
    manager: EntityManager,
    calendarId: string,
    changes: CalendarChange,
  ) {
    await manager.getRepository(CalendarLog).save({
      calendar: { id: calendarId },
      calendarChange: changes,
    })
  }
}
