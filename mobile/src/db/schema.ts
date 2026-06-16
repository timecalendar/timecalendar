import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

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
//    order of canonical UTC ISO-8601 equals chronological order, so findInRange
//    range-filters on plain text columns). Canonicality is guaranteed by the
//    row↔domain mappers' toISOString().
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
