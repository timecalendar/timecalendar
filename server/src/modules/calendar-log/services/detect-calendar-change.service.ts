import { Injectable } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { findEventChanges } from "modules/calendar-log/models/change-detection/find-event-changes"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { CalendarLogRepository } from "modules/calendar-log/repositories/calendar-log.repository"
import { CalendarContentUpdatedEvent } from "modules/calendar-sync/events/calendar-content-updated.event"

@Injectable()
export class DetectCalendarChangeService {
  constructor(private readonly calendarLogRepository: CalendarLogRepository) {}

  @OnEvent("calendar.content.updated")
  async handleCalendarContentUpdated({
    calendarId,
    oldEvents,
    newEvents,
  }: CalendarContentUpdatedEvent) {
    // Detect changes using the existing logic
    const referenceDate = new Date()
    const changes = findEventChanges(referenceDate, oldEvents, newEvents)

    // Check if there are any changes to log
    if (this.hasChanges(changes)) {
      await this.saveCalendarLog(calendarId, changes)
    }
  }

  private hasChanges(changes: CalendarChange): boolean {
    return (
      changes.oldItems.length > 0 ||
      changes.newItems.length > 0 ||
      changes.changedItems.length > 0
    )
  }

  private async saveCalendarLog(calendarId: string, changes: CalendarChange) {
    await this.calendarLogRepository.save({
      calendar: { id: calendarId },
      calendarChange: changes,
    })
  }
}
