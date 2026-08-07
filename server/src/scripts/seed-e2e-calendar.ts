import { CalendarContent } from "modules/calendar/models/calendar-content.entity"
import { CalendarEvent } from "modules/calendar/models/calendar-event.model"
import { Calendar } from "modules/calendar/models/calendar.entity"
import { EventType } from "modules/fetch/models/event.model"
import { School } from "modules/school/models/school.entity"
import { DataSource } from "typeorm"

/**
 * Token-addressable calendar the mobile E2E Maestro flows sync through `POST
 * /calendars/sync`. Kept constant so the RN app can durably hold this token and
 * assert on deterministic data. The mechanism: the `timecalendar-dev://dev-import
 * ?token=e2e-smoke-calendar` deep link (dev-variant only) resolves this calendar,
 * upserts it into the app's `user_calendars` store, and triggers a sync — the
 * seeded events then render on the calendar/home/details surfaces (see
 * `openspec/changes/add-mobile-e2e-seeded-roundtrips`). The retired Flutter
 * harness (`calendar_flow_test.dart`) formerly seeded a matching local
 * `UserCalendar`; that path is gone.
 */
export const E2E_CALENDAR_TOKEN = "e2e-smoke-calendar"

/**
 * Fixed primary key so the imported `user_calendars` row shares the backend
 * `Calendar.id`: synced events are keyed by `userCalendarId` (the backend
 * `Calendar.id`), so a constant id keeps the seeded events resolvable and the
 * import idempotent across runs.
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
 * Two anchors (all ASCII-safe titles/locations — `mobile/e2e/README.md` avoids
 * cross-platform accent-matching fragility):
 *
 * - The Mon/Tue/Wed **week** events populate the week grid (a weekday anchor is
 *   always inside the visible week even with weekends hidden).
 * - A **today**-anchored dense-overlap cluster (`E2E Overlap A`/`B` overlapping
 *   10:00–12:00 / 11:00–13:00, plus the stable `E2E Today Lecture` for the
 *   details/checklist round-trip and `E2E Today Seminar` for the hide/un-hide
 *   round-trip) populates the home today-timeline and exercises the grid's
 *   column-packing — the Mon/Tue/Wed anchor is usually not today, so home would
 *   otherwise be empty.
 *
 * UTC-"today" caveat: "today" is `now`'s **UTC** day (matching the existing UTC
 * week arithmetic). CI runs the server and device in UTC, so it is deterministic
 * there. On a developer machine whose local day differs from UTC near midnight,
 * the device's local-time `isToday` could disagree with this UTC "today" — a
 * known local-run edge, not a CI flake.
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

  // `now`'s UTC day at a chosen hour — the today anchor (see the UTC-"today"
  // caveat above). Home asserts the today timeline, so the cluster must be today,
  // not Monday.
  const today = (hour: number, minute = 0) => {
    const date = new Date(now)
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
    // Today-anchored dense-overlap cluster (ASCII-safe titles). The two overlap
    // events (10:00-12:00 / 11:00-13:00) exercise the grid + home mini-timeline
    // column-packing. `E2E Today Lecture` (stable, unique title) is the tile the
    // calendar/details/checklist flows tap; `E2E Today Seminar` (stable, unique,
    // distinct) is the tile the hide/un-hide flow uses so the two flows don't
    // collide.
    {
      uid: "e2e-today-overlap-a",
      title: "E2E Overlap A",
      startsAt: today(10),
      endsAt: today(12),
      location: "Room E2E A",
      allDay: false,
      description: "First overlapping event for the E2E column-packing check.",
      teachers: ["E2E Teacher"],
      tags: [],
      type: EventType.CM,
      fields: null,
      exportedAt: now,
    },
    {
      uid: "e2e-today-overlap-b",
      title: "E2E Overlap B",
      startsAt: today(11),
      endsAt: today(13),
      location: "Room E2E B",
      allDay: false,
      description: "Second overlapping event for the E2E column-packing check.",
      teachers: ["E2E Teacher"],
      tags: [],
      type: EventType.TD,
      fields: null,
      exportedAt: now,
    },
    {
      uid: "e2e-today-lecture",
      title: "E2E Today Lecture",
      startsAt: today(14),
      endsAt: today(16),
      location: "Room E2E Lecture",
      allDay: false,
      description:
        "Stable today event the E2E details and checklist flows open.",
      teachers: ["E2E Lecturer"],
      tags: [],
      type: EventType.CM,
      fields: null,
      exportedAt: now,
    },
    {
      uid: "e2e-today-seminar",
      title: "E2E Today Seminar",
      startsAt: today(16),
      endsAt: today(18),
      location: "Room E2E Seminar",
      allDay: false,
      description: "Stable today event the E2E hide/un-hide flow toggles.",
      teachers: ["E2E Lecturer"],
      tags: [],
      type: EventType.TD,
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
