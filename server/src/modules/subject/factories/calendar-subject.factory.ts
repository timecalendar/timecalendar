import { calendarFactory } from "modules/calendar/factories/calendar.factory"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { factoryToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class CalendarSubjectFactory extends AppFactory<CalendarSubject> {}

export const calendarSubjectFactory = factoryBuilder(() => [
  CalendarSubject,
  CalendarSubjectFactory.define(
    ({ associations }) =>
      ({
        calendar:
          associations.calendar ?? factoryToEntity<Calendar>(calendarFactory()),
        subjects: [],
      }) as unknown as CalendarSubject,
  ),
])
