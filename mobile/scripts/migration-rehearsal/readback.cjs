const { tokenFor, calendarIdFor } = require("./fixtures.cjs")

function snapshot(pack = "SEED-A", phase = "baseline") {
  if (!["baseline", "after-sync"].includes(phase))
    throw new Error("Unknown rehearsal phase")
  if (!["SEED-A", "SEED-B"].includes(pack))
    throw new Error("Unknown synthetic seed pack")
  const { db, sql } = require("@/db")
  const storage = require("@/storage")
  const large = pack === "SEED-B"
  const expected = {
    calendars: large ? 3 : 1,
    personalEvents: large ? 60 : 5,
    checklistItems: large ? 134 : 5,
    hiddenUids: large ? 21 : 1,
    hiddenNames: large ? 6 : 1,
  }
  const rows = (table) => db.all(sql.raw(`SELECT * FROM ${table}`))
  const calendars = rows("user_calendars")
  const events = rows("personal_events")
  const checklist = rows("checklist_items")
  const cached = rows("calendar_events")
  // Fail closed before any content-bearing projection on an unknown device state.
  if (
    calendars.some(
      (row) => !/^migration-fixture-calendar-[0-2]$/.test(row.id),
    ) ||
    events.some((row) => !/^migration-fixture-event-\d+$/.test(row.uid)) ||
    checklist.some(
      (row) => !/^migration-fixture-checklist-\d+$/.test(row.uuid),
    ) ||
    cached.some((row) => !/^synthetic-/.test(row.uid))
  )
    throw new Error("Non-synthetic device state refused")
  const hidden = JSON.parse(
    storage.getString(storage.STORAGE_KEYS.hiddenEvents) ?? "{}",
  )
  const journal = db.all(
    sql.raw(
      "SELECT state,report_id,attempt_count,source_version,sqlite_committed,terminal_outcome FROM legacy_migration_run",
    ),
  )
  const outbox = db.all(
    sql.raw(
      "SELECT report_id,attempt_count,next_attempt_at,delivered_at FROM legacy_migration_report_outbox",
    ),
  )
  const date = new Date(2026, 9, 4, 9)
  const stamp = (days = 0, hours = 0, minutes = 0) =>
    new Date(
      date.getTime() + days * 86400000 + hours * 3600000 + minutes * 60000,
    ).toISOString()
  const checks = {
    calendarCount: calendars.length === expected.calendars,
    calendarSourceFields: calendars.every((row) => {
      const index = Number(row.id.split("-").at(-1))
      return (
        row.school_name === (index === 0 ? null : "Synthetic school") &&
        row.school_id === (index === 0 ? null : "synthetic-school") &&
        row.last_updated_at === stamp() &&
        row.created_at === stamp(-30)
      )
    }),
    migrationSuppressed:
      storage.getBoolean(storage.STORAGE_KEYS.migrationSuppressed) === true,
    cachePhase: phase === "baseline" ? cached.length === 0 : cached.length > 0,
    personalEventCount: events.length === expected.personalEvents,
    checklistCount: checklist.length === expected.checklistItems,
    calendarIdentityAndTokens: calendars.every((row) => {
      const index = Number(row.id.split("-").at(-1))
      return (
        row.id === calendarIdFor(index) &&
        row.token === tokenFor(index) &&
        row.name === `Synthetic calendar ${index}` &&
        row.visible === (index === 2 ? 0 : 1)
      )
    }),
    personalFields: events.every((row) => {
      const index = Number(row.uid.split("-").at(-1))
      return (
        row.title === `Synthetic event ${index} é 🌍` &&
        row.color === "#ab23cd" &&
        row.starts_at === stamp(index) &&
        row.ends_at === stamp(index, 1) &&
        row.exported_at === stamp() &&
        row.location === (index % 2 ? "Synthetic room" : null) &&
        row.description ===
          (index % 2 ? "Synthetic description\nUnicode é 🌍" : null)
      )
    }),
    checklistFields: checklist.every((row) => {
      const index = Number(row.uuid.split("-").at(-1))
      return (
        row.event_uid ===
          (index % 2
            ? "synthetic-cached-event"
            : `migration-fixture-event-${index % expected.personalEvents}`) &&
        row.content === `Synthetic checklist ${index}` &&
        row.is_checked === (index % 2 ? 0 : 1) &&
        row.order === index &&
        row.created_at === (index % 2 ? stamp() : null) &&
        row.updated_at === (index % 2 ? stamp(0, 0, 1) : null) &&
        row.deleted_at === (index === 4 ? stamp(0, 0, 2) : null)
      )
    }),
    hiddenUids:
      JSON.stringify(hidden.uidHiddenEvents) ===
      JSON.stringify(
        Array.from(
          { length: expected.hiddenUids },
          (_, index) => `synthetic-hidden-uid-${index}`,
        ),
      ),
    hiddenNames:
      JSON.stringify(hidden.namedHiddenEvents) ===
      JSON.stringify(
        Array.from(
          { length: expected.hiddenNames },
          (_, index) => `Synthetic hidden name ${index}`,
        ),
      ),
    darkTheme: storage.getString(storage.STORAGE_KEYS.theme) === "dark",
    notificationsDisabled:
      storage.getBoolean(storage.STORAGE_KEYS.notificationIsActive) === false,
    startupCalendar:
      storage.getString(storage.STORAGE_KEYS.startupTab) === "calendar",
    weekendsHidden:
      storage.getBoolean(storage.STORAGE_KEYS.showWeekends) === false,
    droppedPreferencesAbsent: [
      storage.STORAGE_KEYS.calendarView,
      storage.STORAGE_KEYS.calendarZoomPixelsPerHour,
      storage.STORAGE_KEYS.notificationDaysAhead,
    ].every((key) => !storage.has(key)),
    changelogImportedOrAdvanced:
      (storage.getNumber(storage.STORAGE_KEYS.changelogSeenVersion) ?? 0) >= 1,
  }
  let selector = null
  if (phase === "after-sync") {
    const { calendarEvents } = require("@/db")
    const {
      decodeSyncedEventRows,
    } = require("@/features/calendar/data/event-decoder")
    const {
      selectPageEvents,
    } = require("@/features/calendar/data/calendar-window-store")
    const { chunkOfPage } = require("@/features/calendar/data/window-chunks")
    const space = { mode: "day", firstWeekday: 1 }
    const decoded = decodeSyncedEventRows(
      db.select().from(calendarEvents).all(),
    )
    const selected = selectPageEvents(
      {
        chunks: new Map([
          [
            chunkOfPage(space, 0),
            {
              status: "ready",
              events: decoded.accepted,
              checklist: new Map(),
              revision: 1,
            },
          ],
        ]),
        visibleCalendarIds: new Set(
          calendars.filter((row) => row.visible).map((row) => row.id),
        ),
      },
      space,
      0,
      {
        hiddenUids: new Set(hidden.uidHiddenEvents),
        hiddenNames: new Set(hidden.namedHiddenEvents),
      },
    )
    selector = {
      source: "shipping selectPageEvents over real SQLite decoded rows",
      decodedCount: decoded.accepted.length,
      visibleCount: selected.events.length,
      hiddenUidsExcluded: selected.events.every(
        (event) => !hidden.uidHiddenEvents.includes(event.identity.uid),
      ),
      hiddenNamesExcluded: selected.events.every(
        (event) => !hidden.namedHiddenEvents.includes(event.title),
      ),
      linkedCourseVisible: selected.events.some(
        (event) => event.identity.uid === "synthetic-cached-event",
      ),
      visibleCourseVisible: selected.events.some(
        (event) => event.identity.uid === "synthetic-visible-course",
      ),
    }
    checks.hiddenSelector =
      selector.hiddenUidsExcluded &&
      selector.hiddenNamesExcluded &&
      selector.linkedCourseVisible &&
      selector.visibleCourseVisible
  }
  return {
    fixture: pack,
    phase,
    syntheticOnly: true,
    expected,
    selector,
    counts: {
      calendars: calendars.length,
      personalEvents: events.length,
      checklistItems: checklist.length,
      cachedEvents: cached.length,
      activeSchoolLinkedChecklist: checklist.filter(
        (row) =>
          row.event_uid === "synthetic-cached-event" && row.deleted_at === null,
      ).length,
    },
    checks,
    allChecksPass: Object.values(checks).every(Boolean),
    journal,
    outbox,
    cached: {
      linkedCoursePresent: cached.some(
        (row) => row.uid === "synthetic-cached-event",
      ),
      visibleCoursePresent: cached.some(
        (row) => row.uid === "synthetic-visible-course",
      ),
      revision2Present: cached.some(
        (row) => row.title === "Synthetic visible course revision 2",
      ),
    },
    eligible:
      require("@/features/legacy-migration/data/runtime").isLegacyMigrationEligible(),
  }
}

module.exports = { snapshot }
