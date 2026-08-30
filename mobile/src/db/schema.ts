import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

// The first real feature schema — Personal events (TIM-132 / ADR 011).
//
// Columns mirror the Flutter PersonalEvent.toMap() wire format verbatim so the
// Phase-09 one-shot importer can write recovered rows with no data loss and
// minimal transformation (importer fidelity is the load-bearing constraint):
//  - `uid` is the sembast record key (a UUID) and the identity/upsert key — the
//    explicit primary key, not a surrogate (the uid IS the identity in both the
//    Flutter store and the importer wire format).
//  - `color` holds the `#RRGGBB` hex string verbatim (ColorUtils.colorToHex,
//    alpha stripped) — TEXT-verbatim is the zero-transformation choice (D3).
//  - `startsAt` / `endsAt` / `exportedAt` hold UTC ISO-8601 strings (the exact
//    `DateTime.toUtc().toIso8601String()` shape). TEXT over epoch-ms for importer
//    fidelity AND because lexicographic order of canonical UTC ISO-8601 equals
//    chronological order, so the range query sorts/filters with a plain text
//    column (ADR 011 / D4). Canonicality is guaranteed by the row↔domain mappers.
//  - `kind` (EventKind.Personal) is a constant — not stored.
//
// This file imports drizzle-orm/sqlite-core (lint-banned outside src/db/**),
// which is why the schema lives in the @/db seam dir.
export const personalEvents = sqliteTable("personal_events", {
  uid: text("uid").primaryKey(),
  title: text("title").notNull(),
  color: text("color").notNull(),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  exportedAt: text("exported_at").notNull(),
  location: text("location"),
  description: text("description"),
})

// The second real feature schema — Calendar identity persistence (ADR 018, the
// load-bearing ship: the token IS the user's identity, no server backup).
//
// Columns mirror the Flutter UserCalendar.toDbMap() wire format verbatim so the
// Phase-09 one-shot importer can write recovered `user_calendars` rows (carrying
// the irreplaceable token) with no data loss and minimal transformation — the
// same importer-fidelity posture ADR 011 set for `personal_events`:
//  - `id` is the sembast record key (`_store.record(calendar.id).put`) and the
//    identity/upsert key — the explicit primary key, NOT the token, NOT a
//    surrogate (verified against the Flutter repo + the §3.2 device JSONL dump).
//  - `token` is the irreplaceable subscription identity (the single most critical
//    sembast field per the migration-research doc) — not the PK, but the lookup
//    key for getByToken.
//  - `lastUpdatedAt` / `createdAt` hold UTC ISO-8601 strings (the exact
//    `DateTime.toUtc().toIso8601String()` shape — ADR 011/D4 posture: TEXT over
//    epoch-ms for importer fidelity AND because lexicographic order of canonical
//    UTC ISO-8601 equals chronological order). Canonicality is guaranteed by the
//    row↔domain mappers.
//  - `schoolName` / `schoolId` are nullable (null↔undefined at the mapper edge).
//  - `visible` is a boolean (SQLite has no boolean — Drizzle `mode: "boolean"`
//    stores 0/1); default true mirrors Flutter's `visible = true`.
export const userCalendars = sqliteTable("user_calendars", {
  id: text("id").primaryKey(),
  token: text("token").notNull(),
  name: text("name").notNull(),
  schoolName: text("school_name"),
  schoolId: text("school_id"),
  lastUpdatedAt: text("last_updated_at").notNull(),
  createdAt: text("created_at").notNull(),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
})

// The third real feature schema — Calendar sync (ADR 021, building on ADR
// 011/018). The events a user sees come from POST /calendars/sync over the
// durable user_calendars tokens, dropped+replaced into this table each sync.
//
// Columns mirror the Flutter CalendarEvent.toDbMap() + the server
// CalendarEventForPublic DTO verbatim so the Phase-09 one-shot importer can write
// recovered `calendar_events` rows with no data loss — the same importer-fidelity
// posture ADR 011 set for `personal_events` and ADR 018 for `user_calendars`:
//  - `uid` is the sembast record key and the replace identity — the explicit
//    primary key, not a surrogate (the uid IS the identity, like personal_events).
//  - `color` / `groupColor` hold `#RRGGBB` hex strings verbatim (zero
//    transformation — ADR 011/D3).
//  - `startsAt` / `endsAt` / `exportedAt` hold UTC ISO-8601 strings (ADR 011/D4
//    posture: TEXT over epoch-ms for importer fidelity AND because lexicographic
//    order of canonical UTC ISO-8601 equals chronological order, so range filters
//    and ordered reads work on plain text columns). Canonicality is guaranteed by
//    the row↔domain mappers' toISOString().
//  - `location` / `description` are nullable (null↔undefined at the mapper edge).
//  - `allDay` is a boolean (SQLite has no boolean — Drizzle `mode: "boolean"`
//    stores 0/1, mirroring user_calendars.visible).
//  - `teachers` / `tags` / `fields` are the first non-scalar columns: plain TEXT
//    holding JSON (ADR 021 / D2 — NOT Drizzle `mode: "json"`). The pure mappers
//    own the JSON encode/decode so a corrupt/legacy value degrades to a safe
//    default ([] / null) rather than throwing the whole read — a `mode: "json"`
//    column cannot do that. `teachers`/`tags` are notNull (the DTO always
//    supplies arrays, possibly empty); `fields` is nullable (the DTO's
//    `fields: CalendarEventCustomFields | null`).
//  - `type` holds the EventTypeEnum value as a plain TEXT string VERBATIM — NOT a
//    checked Drizzle enum: importer fidelity requires that an unknown future
//    server value round-trip rather than throw a constraint. The domain narrows
//    it to the union with a cast at the mapper edge. (Note: the Flutter toDbMap()
//    does not persist `type`; we carry it from the DTO for richer rendering
//    parity — the importer supplies a safe default for recovered sembast rows;
//    recorded in ADR 021 so it is not flagged as a fidelity gap.)
//  - `userCalendarId` is the parent user_calendars.id, attached during the
//    flatten (Flutter `fromApi(e, userCalendarId: c.calendar.id)`). A SOFT
//    reference, NO FK constraint — drop+replace clears events independently of
//    the calendar table; a dangling id after a calendar removal is harmless and
//    the next sync reconciles fully.
export const calendarEvents = sqliteTable("calendar_events", {
  uid: text("uid").primaryKey(),
  title: text("title").notNull(),
  color: text("color").notNull(),
  groupColor: text("group_color").notNull(),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  exportedAt: text("exported_at").notNull(),
  location: text("location"),
  description: text("description"),
  allDay: integer("all_day", { mode: "boolean" }).notNull(),
  teachers: text("teachers").notNull(),
  tags: text("tags").notNull(),
  fields: text("fields"),
  type: text("type").notNull(),
  userCalendarId: text("user_calendar_id").notNull(),
})

// The fourth real feature schema — Event checklists (ADR 024, Phase 05 Ship B).
// A small per-event to-do list a student attaches to a class or a personal event
// ("bring the lab coat"). An importer target with NO server backup — losing an
// item is permanent.
//
// Columns mirror the Flutter ChecklistItem.toMap() wire format verbatim so the
// Phase-09 one-shot importer can write recovered `checklist_items` rows with no
// data loss — the same importer-fidelity posture ADR 011/018/021 set:
//  - `uuid` is the sembast record key (`_store.record(item.uuid).put`) and the
//    identity — the explicit primary key, not a surrogate (the uuid IS the
//    identity, like personal_events.uid / calendar_events.uid).
//  - `eventUid` is the join key to EITHER event kind — it equals a
//    personal_events.uid OR a calendar_events.uid. It is a SOFT reference, NO FK
//    constraint — exactly like calendar_events.userCalendarId. The sync
//    replaceAll drops+re-inserts a synced event's calendar_events row each sync
//    (same uid); a hard FK would cascade-delete the checklist on every sync (data
//    loss!) or block the drop, so the soft ref is mandatory for survival across
//    sync. A dangling eventUid after a real deletion is harmless (its items are
//    simply unreachable). (ADR 024 / decision 2.)
//  - `content` / `isChecked` / `order` verbatim. `isChecked` is a boolean (SQLite
//    has no boolean — Drizzle `mode: "boolean"` stores 0/1). `order` is a 1-based
//    INTEGER (Flutter sets `length + 1` on add and re-numbers `i + 1` on reorder);
//    the read sorts on it ascending.
//  - `createdAt` / `updatedAt` / `deletedAt` hold UTC ISO-8601 strings (ADR 011/D4
//    posture: TEXT over epoch-ms for importer round-trip fidelity). All three are
//    NULLABLE — the Flutter model's three dates are DateTime?. Canonicality is
//    guaranteed by the row↔domain mappers' toISOString().
//  - DELETE IS HARD, NOT SOFT (ADR 024 / decision 3 — verified against the Flutter
//    code): the repository's delete hard-removes the row, and `deletedAt` is NEVER
//    set or filtered on anywhere in Flutter. The `deletedAt` column is kept ONLY
//    for verbatim importer fidelity (an imported sembast record may carry a
//    non-null value the importer must round-trip); the app neither sets nor reads
//    it, and the read filters by `eventUid` ordered by `order` with NO
//    `deletedAt IS NULL`. Do NOT add a soft-delete filter "for correctness" — it
//    would diverge from Flutter and silently change which items render.
export const checklistItems = sqliteTable("checklist_items", {
  uuid: text("uuid").primaryKey(),
  eventUid: text("event_uid").notNull(),
  content: text("content").notNull(),
  isChecked: integer("is_checked", { mode: "boolean" }).notNull(),
  order: integer("order").notNull(),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
  deletedAt: text("deleted_at"),
})

// The fifth real feature schema — Activity history (TIM-396, Ticket 3 of the
// Activity revival). A device-local cache of the server's `calendar_log` rows so
// a student can read what changed in their timetable while offline.
//
// UNLIKE the four tables above, this is NOT a Phase-09 importer target. Flutter's
// `calendar_logs` store is rebuildable backend-bound data that the revival
// deliberately does not import, so the importer-fidelity constraint that shaped
// ADR 011/018/021/024 column-for-column DOES NOT apply here — do not read a
// Flutter wire format into these columns. The shape comes from the server
// CalendarLogGet DTO frozen by the Activity revival specification.
//
// It also does NOT inherit calendar_events' drop+replace: history is
// cursor-paginated, so a newest-page refresh that replaced the table would delete
// every older page the student had already backfilled. Rows are merged by log id.
//  - `id` is the server calendar_log id and the upsert identity — the explicit
//    primary key, not a surrogate (the server id IS the identity across pages,
//    which is what makes a repeated or overlapping page idempotent).
//  - `createdAt` / `updatedAt` hold UTC ISO-8601 strings (the ADR 011/D4 posture:
//    TEXT because lexicographic order of canonical UTC ISO-8601 equals
//    chronological order, so the newest-first read and the one-year age prune
//    both work on a plain text column with no date functions). Canonicality is
//    guaranteed by the mappers, which reject an unparseable timestamp rather than
//    admit a row whose text does not sort.
//  - `changeJson` is the CalendarChangeGet payload as plain TEXT holding JSON —
//    NOT Drizzle `mode: "json"` (ADR 021 / D2). The pure mapper owns the decode so
//    a corrupt row degrades to a skipped row rather than throwing the whole read.
//    Stored verbatim and never expanded into calendar_events.
//  - `calendarId` is the owning user_calendars.id. A SOFT reference, NO FK
//    constraint — like calendar_events.userCalendarId. Ownership is reconciled by
//    the repository's prune (rows for calendars the device no longer holds are
//    deleted on the next page write), not by a cascade.
//  - Two indexes: `created_at` serves the newest-first read and the age prune,
//    `calendar_id` serves the ownership prune.
export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: text("id").primaryKey(),
    calendarId: text("calendar_id").notNull(),
    calendarName: text("calendar_name").notNull(),
    changeJson: text("change_json").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("activity_logs_created_at_idx").on(t.createdAt),
    index("activity_logs_calendar_id_idx").on(t.calendarId),
  ],
)

// The device-local read watermark and pagination state for Activity — a SINGLETON
// row keyed `id = 1`. It is state about the cache, not a collection, so it is one
// row rather than a key/value table.
//
// No row is seeded by the migration and there is no CHECK (id = 1): a MISSING row
// reads as the documented defaults (lastReadAt null, unreadCount 0,
// lastSuccessfulRefreshAt null, olderPageCursor null, olderPageComplete false),
// matching the total-read posture @/storage already uses. A fresh install, a
// reset device, and a device whose state row was somehow lost then behave
// identically, with no migration-time seed to get wrong. The repository is the
// only writer and every write is an upsert on the constant id.
//  - `lastReadAt` is a SERVER-ISSUED time (the response `asOf`, or the newest
//    cached server `created_at` when the screen opened offline) — NEVER the device
//    clock. A device-clock watermark on a phone whose clock is set forward hides
//    every subsequent change permanently; set backward, it re-marks read history
//    as unread forever. Both failures are silent. See the Activity ADR.
//  - `lastSuccessfulRefreshAt` is a DIFFERENT value with a DIFFERENT clock: it
//    feeds the passive-freshness policy (Ticket 4), which compares elapsed LOCAL
//    time, so it is device time. Do not "fix" the inconsistency by unifying them.
//  - `olderPageCursor` / `olderPageComplete` are the backfill chain's position: a
//    stored cursor is preserved by a newest-page refresh and overwritten only by a
//    successful older-page write, so a partial backfill never restarts at page two.
//  - `olderPageComplete` is a boolean (SQLite has no boolean — Drizzle
//    `mode: "boolean"` stores 0/1, mirroring user_calendars.visible).
export const activityState = sqliteTable("activity_state", {
  id: integer("id").primaryKey(),
  lastReadAt: text("last_read_at"),
  unreadCount: integer("unread_count").notNull().default(0),
  lastSuccessfulRefreshAt: text("last_successful_refresh_at"),
  olderPageCursor: text("older_page_cursor"),
  olderPageComplete: integer("older_page_complete", { mode: "boolean" })
    .notNull()
    .default(false),
})
