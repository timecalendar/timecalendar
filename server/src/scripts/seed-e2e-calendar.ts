import { addDays } from "date-fns"
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
 * Builds the deterministic E2E smoke calendar's events for a given seed instant.
 *
 * Split out of `seedE2eCalendar` as a **pure** function of `now` so the seed's
 * date contract is provable without a database: the rollover proof in
 * `seed-e2e-calendar.spec.ts` pins `now` on either side of a UTC midnight and
 * asserts which agenda window each event lands in. Mocking the repositories would
 * have tested TypeORM, not the arithmetic that actually broke.
 *
 * The events are dated **relative to the seed run** so they always land in the
 * calendar's current-week view. `typeorm-fixtures-cli` does not evaluate its
 * `<( )>` expressions inside JSON columns, so the relative dates cannot be
 * expressed in a YAML fixture — this guarded seed step exists instead (see
 * `openspec/changes/nominal-e2e-flows/design.md`, Decision 3).
 *
 * Three anchors (all ASCII-safe titles/locations — `mobile/e2e/README.md` avoids
 * cross-platform accent-matching fragility):
 *
 * - The Mon/Tue/Wed **week** events populate the week grid (a weekday anchor is
 *   always inside the visible week even with weekends hidden).
 * - A **today**-anchored dense-overlap cluster (`E2E Overlap A`/`B` overlapping
 *   10:00–12:00 / 11:00–13:00, plus the stable `E2E Today Lecture` for the
 *   details/checklist round-trip) populates the home today-timeline and exercises
 *   the grid's column-packing — the Mon/Tue/Wed anchor is usually not today, so
 *   home would otherwise be empty.
 * - A **next-UTC-day** hide pair (`E2E Hide Seminar` + its `E2E Hide Control`
 *   companion) that `hidden-events.yaml` hides and un-hides. See the rollover
 *   contract below for why it is deliberately NOT in the today cluster.
 *
 * UTC-rollover contract (run 33220510226): the seed runs once, at the start of a
 * job that can last over an hour, and the app computes the agenda's window from
 * the *device's* clock at the moment the flow mounts it. That window is
 * `[today 00:00, today + 7 days)` — half-open and **forward-only**
 * (`mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`).
 * When a long job crosses UTC midnight, every seed-day event falls out of it: the
 * iOS job seeded on Aug 28, reached `hidden-events` on Aug 29, and the agenda
 * rendered `No events this period.` — so the hide target AND its non-hidden
 * control both vanished, and the flow failed on a date defect that reads exactly
 * like a broken hide. Anchoring the hide pair on the **next** UTC day puts it
 * inside the window from both the seed day's and the following day's anchor, so
 * one midnight crossing cannot move it out. The native job is bounded far below a
 * second crossing.
 *
 * The today cluster deliberately keeps its seed-day anchor: `home.yaml` asserts
 * the *today* timeline, which no other anchor can satisfy. It therefore carries
 * the same one-midnight exposure, recorded rather than papered over — see
 * `openspec/changes/restore-mobile-e2e-local-backend-capability/tasks.md` §21.
 *
 * UTC-"today" caveat: "today" is `now`'s **UTC** day (matching the existing UTC
 * week arithmetic). CI runs the server and device in UTC, so it is deterministic
 * there. On a developer machine whose local day differs from UTC near midnight,
 * the device's local-time `isToday` could disagree with this UTC "today" — a
 * known local-run edge, not a CI flake.
 */
export const buildE2eCalendarEvents = (now: Date): CalendarEvent[] => {
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

  // `now`'s UTC day, offset by whole UTC days, at a chosen hour — the today
  // anchor at `dayOffset = 0` (see the UTC-"today" caveat above). Home asserts the
  // today timeline, so the cluster must be today, not Monday.
  const fromToday = (dayOffset: number, hour: number, minute = 0) => {
    const date = new Date(now)
    date.setUTCDate(date.getUTCDate() + dayOffset)
    date.setUTCHours(hour, minute, 0, 0)
    return date
  }

  const today = (hour: number, minute = 0) => fromToday(0, hour, minute)

  // The UTC day immediately after the seed run — inside the agenda's forward-only
  // seven-day window from both the seed day's anchor and the next day's, so one
  // midnight crossing mid-job cannot move these events out of it.
  const nextDay = (hour: number, minute = 0) => fromToday(1, hour, minute)

  return [
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
    // calendar/details/checklist flows tap. The hide/un-hide pair used to live
    // here too; it now sits on the next UTC day (see the rollover contract above)
    // and stays titled distinctly so the flows still cannot collide.
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
    // Next-UTC-day hide pair. Date-neutral titles on purpose: an `E2E Today …`
    // name on an event that is deliberately NOT today is the kind of drift that
    // sends the next reader looking for a bug in the app.
    //
    // `E2E Hide Control` is the non-hidden companion `hidden-events.yaml` waits
    // for before `assertNotVisible`, so a silently empty agenda cannot pass that
    // assertion vacuously. It has to share the target's day: the flow's previous
    // control was the seed-day `E2E Today Lecture`, which falls out of the
    // agenda's forward-only window on exactly the midnight crossing the target
    // was moved to survive.
    {
      uid: "e2e-hide-control",
      title: "E2E Hide Control",
      startsAt: nextDay(14),
      endsAt: nextDay(16),
      location: "Room E2E Control",
      allDay: false,
      description:
        "Non-hidden neighbour proving the E2E hide filter hides only its target.",
      teachers: ["E2E Lecturer"],
      tags: [],
      type: EventType.CM,
      fields: null,
      exportedAt: now,
    },
    {
      uid: "e2e-hide-seminar",
      title: "E2E Hide Seminar",
      startsAt: nextDay(16),
      endsAt: nextDay(18),
      location: "Room E2E Seminar",
      allDay: false,
      description: "Stable event the E2E hide/un-hide flow toggles.",
      teachers: ["E2E Lecturer"],
      tags: [],
      type: EventType.TD,
      fields: null,
      exportedAt: now,
    },
  ]
}

/**
 * Seeds the deterministic E2E smoke calendar (`Calendar` + `CalendarContent`).
 *
 * The event set and its date contract live in the pure `buildE2eCalendarEvents`
 * above; this function is the database side only.
 *
 * `syncPlannedAt` is set well into the future on purpose: `CalendarSyncAllService`
 * only re-fetches a calendar whose planned sync date has passed, so a future
 * plan keeps `/calendars/sync` from making an external iCal call — it just
 * returns this seeded `CalendarContent`.
 */
export const seedE2eCalendar = async (dataSource: DataSource) => {
  const calendarRepository = dataSource.getRepository(Calendar)
  const calendarContentRepository = dataSource.getRepository(CalendarContent)
  const schoolRepository = dataSource.getRepository(School)

  const school = await schoolRepository.findOneBy({ code: "mygamingacademia" })

  const now = new Date()
  const events = buildE2eCalendarEvents(now)

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
    syncPlannedAt: addDays(now, 1),
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
