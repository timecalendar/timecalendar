import type {
  CalendarEventCustomFields,
  CalendarEventForPublic,
  EventTag,
} from "@/api/generated/timeCalendar.schemas"
import { calendarEvents } from "@/db"
import type { CalendarEvent } from "@/features/calendar/data/types"

// The DTO→row writer + the row→domain reader for synced calendar events (ADR 021,
// building on ADR 011/018). They isolate the TEXT-ISO + JSON-as-TEXT storage
// format. Pure (no `db`) so they unit-test exhaustively without any SQLite mock.
//
// Two directions, two purposes:
//   - dtoToRow         (WRITE)  — the server DTO → a calendar_events ROW, VERBATIM.
//                                 This is the live-sync write path AND the shape the
//                                 Phase-09 importer writes directly: NO data loss
//                                 (full groupColor / type enum / rich tags / full
//                                 fields survive). It carries the importer-fidelity
//                                 guarantee: canonical UTC ISO-8601 dates
//                                 (toISOString()) — the property the TEXT date
//                                 columns rely on — and a canonical JSON string for
//                                 the non-scalar columns.
//   - rowToCalendarEvent (READ) — a stored ROW → the ergonomic domain `CalendarEvent`
//                                 (the EXISTING shape from data/types — no consumer
//                                 change). The domain is a deliberately-lossy
//                                 RENDERING projection (tags→names, canceled only);
//                                 the verbatim fidelity lives in the ROW, never the
//                                 domain (ADR 021 / D1).
//
// dtoToRow is the ONLY place the generated CalendarEventForPublic DTO type touches
// the data layer, and it lives in data/ (B-1, the data/-only-seam rule).

type CalendarEventRow = typeof calendarEvents.$inferSelect
type CalendarEventInsert = typeof calendarEvents.$inferInsert

// Decode a JSON TEXT column DEFENSIVELY (ADR 021 / D2): a corrupt/legacy/
// unparseable value must NOT throw the whole list read, so a parse failure (or a
// non-array value) degrades to []. This is the total-read posture the stores'
// defensive parsers established. A Drizzle `mode: "json"` column would throw
// here, which is exactly why the JSON columns are plain TEXT decoded by hand.
export function decodeJsonArray<T>(raw: string): T[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function decodeFields(
  raw: string | null,
): CalendarEventCustomFields | null {
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

// Parse a stored row into the domain `CalendarEvent` for RENDERING — a
// deliberately-lossy projection of the verbatim row: TEXT ISO strings → Date, null
// location/description → undefined, `allDay` already boolean (Drizzle
// `mode: "boolean"`). The rich `EventTag[]` is decoded defensively then projected
// to `tags: string[]` (tag names) — the display surface renders names; the full
// tag objects (and `groupColor`/`type`/the rich `fields`) stay in the row, written
// verbatim by dtoToRow. `canceled` derives from the decoded `fields?.canceled`.
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

// Serialize the server CalendarEventForPublic DTO → a calendar_events ROW,
// VERBATIM (ADR 021 / D1 — the table's entire justification). Every column the DTO
// carries reaches the row with NO data loss: the full `groupColor` (NOT a mirror of
// `color`), the real `type` enum value (NOT a fabricated `class`), the FULL
// `EventTag[]` (`{name,color,icon}` each, JSON-encoded — not name-only), and the
// FULL `CalendarEventCustomFields` object (`{canceled,shortDescription,subject,
// groupColor}`, JSON-encoded — not `{canceled}` only). Dates are normalized to
// canonical UTC ISO-8601 (toISOString() always emits the `…Z` form, so the text
// columns sort chronologically — the findInRange property; a DTO date is already
// canonical UTC, so this is a no-op preserving fidelity), `location`/`description`
// null → null, `exportedAt` carried from the DTO (its server-stamped value, not a
// re-stamp). The parent `userCalendarId` is attached (mirroring Flutter
// `CalendarEvent.fromApi(e, userCalendarId: c.calendar.id)`).
//
// This is the SINGLE write shape: the live sync writes through it AND the Phase-09
// importer writes rows of exactly this shape directly — verbatim fidelity holds
// end-to-end, not just on the import path. The rendering domain is derived FROM the
// row by rowToCalendarEvent, so the lossy domain projection never touches a write.
export function dtoToRow(
  dto: CalendarEventForPublic,
  userCalendarId: string,
): CalendarEventInsert {
  return {
    uid: dto.uid,
    title: dto.title,
    color: dto.color,
    groupColor: dto.groupColor,
    startsAt: new Date(dto.startsAt).toISOString(),
    endsAt: new Date(dto.endsAt).toISOString(),
    exportedAt: new Date(dto.exportedAt).toISOString(),
    location: dto.location,
    description: dto.description,
    allDay: dto.allDay,
    teachers: JSON.stringify(dto.teachers),
    tags: JSON.stringify(dto.tags),
    fields: dto.fields === null ? null : JSON.stringify(dto.fields),
    type: dto.type,
    userCalendarId,
  }
}
