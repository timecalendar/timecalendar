import { CalendarLog } from "modules/calendar-log/models/calendar-log.entity"
import { calendarEventFactory } from "modules/calendar/factories/calendar-event.factory"
import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { factoryToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class CalendarLogFactory extends AppFactory<CalendarLog> {
  newItem() {
    const calendarChange = this.build().calendarChange
    calendarChange.newItems.push(calendarEventFactory().build())
    return this.params({ calendarChange })
  }
}

export const calendarLogFactory = factoryBuilder(() => [
  CalendarLog,
  CalendarLogFactory.define(
    ({ associations }) =>
      ({
        calendar: associations.calendar || factoryToEntity(calendarFactory()),
        calendarChange: {
          changedItems: [],
          newItems: [],
          oldItems: [],
        },
      }) as Partial<CalendarLog> as CalendarLog,
  ),
])
