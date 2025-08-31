import { Injectable } from "@nestjs/common"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { CalendarLogGet } from "modules/calendar-log/models/dto/calendar-log-get.dto"
import { CalendarChangeGet } from "modules/calendar-log/models/dto/calendar-change-get.dto"
import { CalendarLogEventGet } from "modules/calendar-log/models/dto/calendar-log-event-get.dto"
import { CalendarChangedItem } from "modules/calendar-log/models/dto/calendar-changed-item.dto"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"

@Injectable()
export class CalendarLogMapper {
  toCalendarLogGet(entity: CalendarLog): CalendarLogGet {
    const dto = new CalendarLogGet()
    dto.id = entity.id
    dto.calendarId = entity.calendar.id
    dto.calendarToken = entity.calendar.token
    dto.calendarName = entity.calendar.name
    dto.calendarChange = this.mapCalendarChange(entity.calendarChange)
    dto.createdAt = entity.createdAt
    dto.updatedAt = entity.updatedAt
    return dto
  }

  private mapCalendarChange(change: CalendarChange): CalendarChangeGet {
    const changeDto = new CalendarChangeGet()
    changeDto.oldItems = change.oldItems.map(this.mapCalendarEvent)
    changeDto.newItems = change.newItems.map(this.mapCalendarEvent)
    changeDto.changedItems = change.changedItems.map(
      ([old, newEvent]: [EventForChangeDetection, EventForChangeDetection]) => {
        const changedItem = new CalendarChangedItem()
        changedItem.previousItem = this.mapCalendarEvent(old)
        changedItem.newItem = this.mapCalendarEvent(newEvent)
        return changedItem
      },
    )
    return changeDto
  }

  private mapCalendarEvent(
    event: EventForChangeDetection,
  ): CalendarLogEventGet {
    const eventDto = new CalendarLogEventGet()
    eventDto.uid = event.uid
    eventDto.title = event.title
    eventDto.startsAt = event.startsAt
    eventDto.endsAt = event.endsAt
    eventDto.location = event.location
    return eventDto
  }
}
