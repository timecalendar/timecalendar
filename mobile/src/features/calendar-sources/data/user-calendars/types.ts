import type { CalendarForPublic } from "@/api/generated/timeCalendar.schemas"
import { userCalendars } from "@/db"

// The domain UserCalendar type, the pure row↔domain mappers, and the server-DTO
// mapper. They isolate the TEXT-ISO + integer-boolean storage format (ADR 018 /
// D5) from ergonomic domain types — pure (no `db`) so they unit-test
// exhaustively without any SQLite mock, and they carry the importer-fidelity
// guarantee: calendarToRow always writes a canonical UTC ISO-8601 string
// (toISOString()), the property the TEXT date columns rely on.
//
// This is the ONLY place the generated CalendarForPublic DTO type touches the
// data layer, and it lives in data/ (B-1, the data/-only-seam rule).

type UserCalendarRow = typeof userCalendars.$inferSelect
type UserCalendarInsert = typeof userCalendars.$inferInsert

export interface UserCalendar {
  id: string
  token: string
  name: string
  schoolName: string | undefined
  schoolId: string | undefined
  lastUpdatedAt: Date
  createdAt: Date
  visible: boolean
}

// Parse a stored row into the domain type: TEXT ISO strings → Date, null
// school_name/school_id → undefined; `visible` is already a boolean (Drizzle's
// `mode: "boolean"` surfaces 0/1 as boolean).
export function rowToCalendar(row: UserCalendarRow): UserCalendar {
  return {
    id: row.id,
    token: row.token,
    name: row.name,
    schoolName: row.schoolName ?? undefined,
    schoolId: row.schoolId ?? undefined,
    lastUpdatedAt: new Date(row.lastUpdatedAt),
    createdAt: new Date(row.createdAt),
    visible: row.visible,
  }
}

// Serialize a domain calendar into a row: Date → canonical UTC ISO-8601 string
// (toISOString() always emits the canonical `…Z` form, so the text columns sort
// chronologically), undefined school_name/school_id → null. `visible` is handled
// by Drizzle's boolean mode.
export function calendarToRow(calendar: UserCalendar): UserCalendarInsert {
  return {
    id: calendar.id,
    token: calendar.token,
    name: calendar.name,
    schoolName: calendar.schoolName ?? null,
    schoolId: calendar.schoolId ?? null,
    lastUpdatedAt: calendar.lastUpdatedAt.toISOString(),
    createdAt: calendar.createdAt.toISOString(),
    visible: calendar.visible,
  }
}

// Map the server CalendarForPublic DTO → the domain type, mirroring the Flutter
// UserCalendar.fromCalendarForPublic. The DTO mirrors the wire format one-to-one,
// so this is a field copy: DTO `schoolName: string | null` → undefined, ISO date
// strings → Date, `schoolId?` carried, `visible` defaulting to true (a
// client-only field, not on the DTO).
export function fromCalendarForPublic(dto: CalendarForPublic): UserCalendar {
  return {
    id: dto.id,
    token: dto.token,
    name: dto.name,
    schoolName: dto.schoolName ?? undefined,
    schoolId: dto.schoolId ?? undefined,
    lastUpdatedAt: new Date(dto.lastUpdatedAt),
    createdAt: new Date(dto.createdAt),
    visible: true,
  }
}
