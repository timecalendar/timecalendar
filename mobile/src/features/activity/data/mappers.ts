import type { CalendarChangeGet } from "@/api/generated/timeCalendar.schemas"
import { dateToIso, isoToDate } from "@/db"

import type {
  ActivityLog,
  ActivityLogDto,
  ActivityLogInsert,
  ActivityLogRow,
} from "./types"

// PURE row↔domain mappers — no `db`, no `@/firebase`, so they unit-test
// exhaustively against literal rows with no SQLite mock. The repository owns
// recording a skipped row; putting that here would make the mapper impure and
// would fire once per bad row on every read.
//
// Both directions are DEFENSIVE and return `null` rather than throwing, matching
// the ADR 021 posture for structured calendar-event fields: one corrupt row is
// skipped, never fatal to the whole read.

/**
 * Canonicalize a timestamp to UTC ISO-8601, or `null` when it cannot be parsed.
 *
 * Canonical text is what makes the plain TEXT date columns sort chronologically,
 * which BOTH the newest-first read and the one-year age prune rely on. A row
 * whose date text is not orderable would silently corrupt both, so it must never
 * reach the table.
 */
export function canonicalIso(value: string): string | null {
  const date = isoToDate(value)
  return Number.isNaN(date.getTime()) ? null : dateToIso(date)
}

// A decoded change payload must be an object carrying the three
// CalendarChangeGet item collections. Anything else — a JSON scalar, an array,
// `null`, or an object missing a collection — is not a change we can render.
function decodeChange(json: string): CalendarChangeGet | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null
  }

  const candidate = parsed as Record<string, unknown>
  const collections = ["oldItems", "newItems", "changedItems"] as const
  if (!collections.every((key) => Array.isArray(candidate[key]))) return null

  return parsed as CalendarChangeGet
}

/** Stored row → domain log. `null` when `change_json` cannot be decoded. */
export function rowToActivityLog(row: ActivityLogRow): ActivityLog | null {
  const change = decodeChange(row.changeJson)
  if (change === null) return null

  return {
    id: row.id,
    calendarId: row.calendarId,
    calendarName: row.calendarName,
    change,
    createdAt: isoToDate(row.createdAt),
    updatedAt: isoToDate(row.updatedAt),
  }
}

/**
 * Server DTO → insert row. `null` when either timestamp cannot be parsed, so an
 * unorderable date never reaches the table (see `canonicalIso`). The caller
 * skips such rows exactly as the read skips undecodable ones.
 */
export function dtoToActivityRow(
  dto: ActivityLogDto,
): ActivityLogInsert | null {
  const createdAt = canonicalIso(dto.createdAt)
  const updatedAt = canonicalIso(dto.updatedAt)
  if (createdAt === null || updatedAt === null) return null

  return {
    id: dto.id,
    calendarId: dto.calendarId,
    calendarName: dto.calendarName,
    // Stored VERBATIM as JSON text and never expanded into calendar_events
    // (architecture decision 9 — no durable event snapshot from history).
    changeJson: JSON.stringify(dto.calendarChange),
    createdAt,
    updatedAt,
  }
}
