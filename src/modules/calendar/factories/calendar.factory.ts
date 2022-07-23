import { Calendar } from "modules/calendar/models/calendar.entity"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class CalendarFactory extends AppFactory<Calendar> {
  school(schoolId: string) {
    return this.associations({ school: idToEntity(schoolId) })
  }
}

export const calendarFactory = factoryBuilder(() => [
  Calendar,
  CalendarFactory.define(
    ({ associations }) =>
      ({
        name: "My Calendar",
        schoolName: associations.school ? null : "My School",
        school: associations.school,
        url: "https://timecalendar.app/calendar/ical",
        lastUpdatedAt: new Date(),
      } as Calendar),
  ),
])
