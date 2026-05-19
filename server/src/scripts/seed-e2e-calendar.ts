import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { EventType } from "modules/fetch/models/event.model"
import { School } from "modules/school/models/school.entity"
import { DataSource } from "typeorm"

/**
 * Token-addressable calendar the E2E smoke suite (`calendar_flow_test.dart`)
 * syncs through `POST /calendars/sync`. Kept constant so the Flutter test can
 * seed a matching local `UserCalendar` and assert on deterministic data.
 */
export const E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"

/**
 * Fixed primary key so the Flutter side can seed a `UserCalendar` with the same
 * `id`: `eventsForViewProvider` filters events by `userCalendarId`, which is the
 * backend `Calendar.id`, so the two must agree for the seeded events to render.
 */
export const E2E_CALENDAR_ID = "e2e0e2e0-0000-4000-8000-000000000001"

/**
 * Seeds the deterministic E2E smoke calendar (`Calendar` + `CalendarContent`).
 *
 * The events are dated **relative to the seed run** so they always land in the
 * calendar's current-week view. `typeorm-fixtures-cli` does not evaluate its
 * `<( )>` expressions inside JSON columns, so the relative dates cannot be
 * expressed in a YAML fixture — this guarded seed step exists instead (see
 * `openspec/changes/nominal-e2e-flows/design.md`, Decision 3).
 *
 * `lastUpdatedAt` is set to "now" on purpose: `CalendarSyncAllService` only
 * re-fetches a calendar whose `lastUpdatedAt` is older than `UPDATE_AFTER_MIN`,
 * so a fresh timestamp keeps `/calendars/sync` from making an external iCal
 * call — it just returns this seeded `CalendarContent`.
 */
export const seedE2eCalendar = async (dataSource: DataSource) => {
  const calendarRepository = dataSource.getRepository(Calendar)
  const calendarContentRepository = dataSource.getRepository(CalendarContent)
  const schoolRepository = dataSource.getRepository(School)

  const school = await schoolRepository.findOneBy({ code: "mygamingacademia" })

  const now = new Date()

  // Anchor the events on the Monday of the current week (always a weekday, so
  // they show even with weekends hidden, and always inside the visible week).
  // All arithmetic is in UTC: the seed host and the test emulator can be in
  // different timezones, so a UTC anchor keeps the events on a deterministic
  // weekday regardless of either host's offset (CI runs both in UTC).
  const monday = new Date(now)
  const isoWeekday = monday.getUTCDay() === 0 ? 7 : monday.getUTCDay()
  monday.setUTCDate(monday.getUTCDate() - (isoWeekday - 1))
  monday.setUTCHours(0, 0, 0, 0)

  const at = (dayOffset: number, hour: number, minute = 0) => {
    const date = new Date(monday)
    date.setUTCDate(date.getUTCDate() + dayOffset)
    date.setUTCHours(hour, minute, 0, 0)
    return date
  }

  const events: CalendarEvent[] = [
    {
      uid: "e2e-event-1",
      title: "Cours E2E Test",
      startsAt: at(0, 9),
      endsAt: at(0, 11),
      location: "Salle E2E",
      allDay: false,
      description: "Cours utilisé par le test de fumée end-to-end.",
      teachers: ["Professeur E2E"],
      tags: [],
      type: EventType.CM,
      fields: null,
      exportedAt: now,
    },
    {
      uid: "e2e-event-2",
      title: "TD E2E Test",
      startsAt: at(1, 14),
      endsAt: at(1, 16),
      location: "Salle E2E 2",
      allDay: false,
      description: "Travaux dirigés utilisés par le test de fumée.",
      teachers: ["Professeur E2E"],
      tags: [],
      type: EventType.TD,
      fields: null,
      exportedAt: now,
    },
    {
      uid: "e2e-event-3",
      title: "TP E2E Test",
      startsAt: at(2, 10),
      endsAt: at(2, 12),
      location: "Salle E2E 3",
      allDay: false,
      description: "Travaux pratiques utilisés par le test de fumée.",
      teachers: ["Professeur E2E"],
      tags: [],
      type: EventType.TP,
      fields: null,
      exportedAt: now,
    },
  ]

  // `Calendar.content` is a non-cascading OneToOne (the `CalendarContent` side
  // owns the join column), so the two rows are saved separately — the same
  // split `CalendarSyncService.saveCalendar` uses in production.
  const calendar = await calendarRepository.save({
    id: E2E_CALENDAR_ID,
    token: E2E_CALENDAR_TOKEN,
    name: "Calendrier E2E Test",
    schoolName: school ? null : "My Gaming Academia",
    url: "https://e2e.timecalendar.test/calendar.ics",
    customData: null,
    school: school ?? undefined,
    lastUpdatedAt: now,
    lastAccessedAt: now,
  })

  const existingContent = await calendarContentRepository.findOneBy({
    calendar: { id: calendar.id },
  })

  await calendarContentRepository.save({
    id: existingContent?.id,
    events,
    calendar: { id: calendar.id },
  })
}
