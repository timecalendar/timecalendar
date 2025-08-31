import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { CalendarChange } from "modules/calendar-log/models/calendar-change"
import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { EventForChangeDetection } from "modules/calendar-log/models/change-detection/find-event-changes"
import {
  factoryToEntity,
  idToEntity,
} from "modules/shared/utils/typeorm/id-to-entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

interface TransientParams {
  calendarChange?: CalendarChange
}

export class CalendarLogFactory extends AppFactory<
  CalendarLog,
  TransientParams
> {
  calendar(calendarId?: string) {
    return this.associations({
      calendar: calendarId
        ? idToEntity(calendarId)
        : factoryToEntity<Calendar>(calendarFactory()),
    })
  }
}

const createSampleEvent = (
  uid: string,
  title: string,
): EventForChangeDetection => ({
  uid,
  title,
  location: "Test Location",
  startsAt: new Date("2025-01-01T10:00:00Z"),
  endsAt: new Date("2025-01-01T11:00:00Z"),
})

export const calendarLogFactory = factoryBuilder(() => [
  CalendarLog,
  CalendarLogFactory.define(
    ({ associations, transientParams }) =>
      ({
        calendar: associations.calendar,
        calendarChange: transientParams.calendarChange || {
          oldItems: [createSampleEvent("old-1", "Old Event")],
          newItems: [createSampleEvent("new-1", "New Event")],
          changedItems: [
            [
              createSampleEvent("changed-1", "Old Title"),
              createSampleEvent("changed-1", "New Title"),
            ],
          ],
        },
      }) as CalendarLog,
  ),
])
