import type {
  CalendarEventCustomFields,
  CalendarEventForPublic,
  EventTag,
} from "@/api/generated/timeCalendar.schemas"
import { calendarEvents } from "@/db"
import type { CalendarEvent } from "@/features/calendar/data/types"

// The row↔domain mappers + the server-DTO mapper for synced calendar events
// (ADR 021, building on ADR 011/018). They isolate the TEXT-ISO + JSON-as-TEXT
// storage format from the ergonomic domain `CalendarEvent` (the EXISTING shape
// from data/types — no shape change to any consumer). Pure (no `db`) so they
// unit-test exhaustively without any SQLite mock, and they carry the importer-
// fidelity guarantee: calendarEventToRow always writes canonical UTC ISO-8601
// strings (toISOString()) — the property the TEXT date columns rely on — and a
// canonical JSON string for the non-scalar columns.
//
// This is the ONLY place the generated CalendarEventForPublic DTO type touches
// the data layer, and it lives in data/ (B-1, the data/-only-seam rule).

type CalendarEventRow = typeof calendarEvents.$inferSelect
type CalendarEventInsert = typeof calendarEvents.$inferInsert

// Decode a JSON TEXT column DEFENSIVELY (ADR 021 / D2): a corrupt/legacy/
// unparseable value must NOT throw the whole list read, so a parse failure (or a
// non-array value) degrades to []. This is the total-read posture the stores'
// defensive parsers established. A Drizzle `mode: "json"` column would throw
// here, which is exactly why the JSON columns are plain TEXT decoded by hand.
function decodeJsonArray<T>(raw: string): T[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function decodeFields(raw: string | null): CalendarEventCustomFields | null {
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed !== null && typeof parsed === "object"
      ? (parsed as CalendarEventCustomFields)
      : null
  } catch {
    return null
  }
}

// Parse a stored row into the domain `CalendarEvent`: TEXT ISO strings → Date,
// null location/description → undefined, `allDay` already boolean (Drizzle
// `mode: "boolean"`). The rich `EventTag[]` is decoded defensively then projected
// to `tags: string[]` (tag names) — the display surface renders names; the full
// tag objects stay in the row for importer fidelity. `canceled` derives from the
// decoded `fields?.canceled`.
export function rowToCalendarEvent(row: CalendarEventRow): CalendarEvent {
  const tags = decodeJsonArray<EventTag>(row.tags)
  const fields = decodeFields(row.fields)
  return {
    id: row.uid,
    title: row.title,
    color: row.color,
    startsAt: new Date(row.startsAt),
    endsAt: new Date(row.endsAt),
    location: row.location ?? undefined,
    allDay: row.allDay,
    description: row.description ?? undefined,
    teachers: decodeJsonArray<string>(row.teachers),
    tags: tags.map((tag) => tag.name),
    canceled: fields?.canceled ?? false,
    // userCalendarId is notNull (the DTO always carries the parent id) — a plain
    // string, no null branch.
    userCalendarId: row.userCalendarId,
  }
}

// Serialize a domain event into a row for the live write path. Date → canonical
// UTC ISO-8601 (toISOString() always emits the `…Z` form, so the text columns
// sort chronologically — the findInRange property), undefined → null, boolean
// `allDay`. The domain carries only `tags: string[]` (names) and `canceled`, so a
// domain→row write reconstructs a minimal `EventTag[]` (name only) and a `fields`
// blob carrying `canceled`. `groupColor` mirrors `color` and `type` defaults to
// `class` when the domain lacks them (the Phase-09 importer writes rich rows
// DIRECTLY, bypassing the domain — same posture as the user-calendars upsert; the
// rich `groupColor`/`type`/tag-object fidelity lives on that import path, while
// the round-trip below proves the domain-carried fields survive). `exportedAt` is
// stamped at write time.
export function calendarEventToRow(event: CalendarEvent): CalendarEventInsert {
  return {
    uid: event.id,
    title: event.title,
    color: event.color,
    groupColor: event.color,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    exportedAt: new Date().toISOString(),
    location: event.location ?? null,
    description: event.description ?? null,
    allDay: event.allDay,
    teachers: JSON.stringify(event.teachers),
    tags: JSON.stringify(
      event.tags.map((name) => ({ name, color: "", icon: "" })),
    ),
    fields: JSON.stringify({ canceled: event.canceled }),
    type: "class",
    userCalendarId: event.userCalendarId ?? "",
  }
}

// Map the server CalendarEventForPublic DTO → the domain `CalendarEvent`,
// attaching the parent `userCalendarId` (mirroring Flutter
// `CalendarEvent.fromApi(e, userCalendarId: c.calendar.id)`). The DTO mirrors the
// wire format one-to-one, so this is a field copy: ISO date strings → Date,
// `location`/`description` null → undefined, `teachers` carried, `tags` projected
// to names (the domain renders names), `canceled` from `fields?.canceled`.
export function fromCalendarEventDto(
  dto: CalendarEventForPublic,
  userCalendarId: string,
): CalendarEvent {
  return {
    id: dto.uid,
    title: dto.title,
    color: dto.color,
    startsAt: new Date(dto.startsAt),
    endsAt: new Date(dto.endsAt),
    location: dto.location ?? undefined,
    allDay: dto.allDay,
    description: dto.description ?? undefined,
    teachers: dto.teachers,
    tags: dto.tags.map((tag) => tag.name),
    canceled: dto.fields?.canceled ?? false,
    userCalendarId,
  }
}
