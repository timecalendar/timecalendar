import { calendarContentFactory } from "modules/calendar/factories/calendar-content.factory"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { schoolFactory } from "modules/school/factories/school.factory"
import { School } from "modules/school/models/school.entity"
import {
  factoryToEntity,
  idToEntity,
} from "modules/shared/utils/typeorm/id-to-entity"
import { nanoid } from "nanoid"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

interface TransientParams {
  events?: CalendarEvent[]
}
export class CalendarFactory extends AppFactory<Calendar, TransientParams> {
  school(schoolId?: string) {
    return this.associations({
      school: schoolId
        ? idToEntity(schoolId)
        : factoryToEntity<School>(schoolFactory()),
    })
  }
}

export const calendarFactory = factoryBuilder(() => [
  Calendar,
  CalendarFactory.define(
    ({ associations, transientParams }) =>
      ({
        token: nanoid(),
        name: "My Calendar",
        schoolName: associations.school ? null : "My School",
        school: associations.school,
        url: "https://timecalendar.app/calendar/ical",
        lastUpdatedAt: new Date(),
        content: factoryToEntity(
          calendarContentFactory().params({
            events: transientParams.events || [],
          }),
        ),
      }) as Calendar,
  ),
])
