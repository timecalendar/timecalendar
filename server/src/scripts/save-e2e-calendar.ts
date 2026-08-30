import { addDays } from "date-fns"
import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { School } from "modules/school/models/school.entity"
import { DataSource } from "typeorm"

interface E2eCalendarInput {
  fields: Pick<Calendar, "id" | "token" | "name" | "url">
  events: CalendarEvent[]
  now: Date
  school: School | null
}

/** Upserts one token-addressable calendar and its non-cascading content row. */
export async function saveE2eCalendar(
  dataSource: DataSource,
  { fields, events, now, school }: E2eCalendarInput,
): Promise<Calendar> {
  const calendar = await dataSource.getRepository(Calendar).save({
    ...fields,
    schoolName: school ? null : "My Gaming Academia",
    customData: null,
    school: school ?? undefined,
    lastUpdatedAt: now,
    syncPlannedAt: addDays(now, 1),
    lastAccessedAt: now,
  })
  const contentRepository = dataSource.getRepository(CalendarContent)
  const existingContent = await contentRepository.findOneBy({
    calendar: { id: calendar.id },
  })
  await contentRepository.save({
    id: existingContent?.id,
    events,
    calendar: { id: calendar.id },
  })
  return calendar
}
