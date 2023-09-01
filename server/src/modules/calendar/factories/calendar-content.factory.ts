import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class CalendarContentFactory extends AppFactory<CalendarContent> {}

export const calendarContentFactory = factoryBuilder(() => [
  CalendarContent,
  CalendarContentFactory.define(
    ({ associations }) =>
      ({
        calendar: associations.calendar,
        events: [],
      }) as Partial<CalendarContent> as CalendarContent,
  ),
])
