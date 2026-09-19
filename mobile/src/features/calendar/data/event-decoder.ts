import { calendarEvents, personalEvents } from "@/db"
import { parseJsonArray } from "@/storage"

import { utcDayKey } from "./day-key"
import { CALENDAR_EVENT_FALLBACK_COLOR, type CalendarEvent } from "./types"

type SyncedRow = typeof calendarEvents.$inferSelect
type PersonalRow = typeof personalEvents.$inferSelect

export const CALENDAR_EVENT_REJECTION_REASONS = [
  "invalid-identity",
  "invalid-start",
  "invalid-end",
  "non-positive-range",
  "invalid-date-range",
] as const

export type CalendarEventRejectionReason =
  (typeof CALENDAR_EVENT_REJECTION_REASONS)[number]
export type CalendarEventRejectionCounts = Readonly<
  Record<CalendarEventRejectionReason, number>
>

export interface CalendarEventDecodeResult {
  accepted: readonly CalendarEvent[]
  rejectedCounts: CalendarEventRejectionCounts
}

function emptyCounts(): Record<CalendarEventRejectionReason, number> {
  return {
    "invalid-identity": 0,
    "invalid-start": 0,
    "invalid-end": 0,
    "non-positive-range": 0,
    "invalid-date-range": 0,
  }
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : undefined
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function color(value: unknown): string {
  return typeof value === "string" && /^#[0-9A-F]{6}$/i.test(value)
    ? value.toUpperCase()
    : CALENDAR_EVENT_FALLBACK_COLOR
}

function jsonValue(raw: unknown): unknown {
  if (typeof raw !== "string") return undefined
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

function stringArray(raw: unknown): readonly string[] {
  return parseJsonArray<unknown>(
    typeof raw === "string" ? raw : undefined,
  ).flatMap((value) => {
    const narrowed = optionalString(value)
    return narrowed === undefined ? [] : [narrowed]
  })
}

function tagNames(raw: unknown): readonly string[] {
  return parseJsonArray<unknown>(
    typeof raw === "string" ? raw : undefined,
  ).flatMap((value) => {
    if (value === null || typeof value !== "object") return []
    const narrowed = optionalString((value as { name?: unknown }).name)
    return narrowed === undefined ? [] : [narrowed]
  })
}

function exactCancellation(raw: unknown): boolean {
  const parsed = jsonValue(raw)
  return (
    parsed !== null &&
    typeof parsed === "object" &&
    (parsed as { canceled?: unknown }).canceled === true
  )
}

function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

function decodeRows<Row>(
  rows: readonly Row[],
  decode: (row: Row) => CalendarEvent | CalendarEventRejectionReason,
): CalendarEventDecodeResult {
  const accepted: CalendarEvent[] = []
  const rejectedCounts = emptyCounts()

  for (const row of rows) {
    const result = decode(row)
    if (typeof result === "string") rejectedCounts[result] += 1
    else accepted.push(result)
  }
  return { accepted, rejectedCounts }
}

export function decodeSyncedEventRows(
  rows: readonly SyncedRow[],
): CalendarEventDecodeResult {
  return decodeRows(rows, (row) => {
    const uid = optionalString(row.uid)
    if (uid === undefined || optionalString(row.userCalendarId) === undefined)
      return "invalid-identity"
    const startsAt = parseDate(row.startsAt)
    if (startsAt === undefined) return "invalid-start"
    const endsAt = parseDate(row.endsAt)
    if (endsAt === undefined) return "invalid-end"
    if (endsAt.getTime() <= startsAt.getTime())
      return row.allDay ? "invalid-date-range" : "non-positive-range"

    const common = {
      version: 1 as const,
      identity: { source: "synced" as const, uid },
      id: uid,
      title: typeof row.title === "string" ? row.title : "",
      color: color(row.color),
      location: optionalString(row.location),
      description: optionalString(row.description),
      teachers: stringArray(row.teachers),
      tags: tagNames(row.tags),
      canceled: exactCancellation(row.fields),
      userCalendarId: row.userCalendarId,
    }

    if (!row.allDay) {
      return { ...common, kind: "timed", allDay: false, startsAt, endsAt }
    }
    if (!isUtcMidnight(startsAt) || !isUtcMidnight(endsAt))
      return "invalid-date-range"
    return {
      ...common,
      kind: "date-only",
      allDay: true,
      startsAt,
      endsAt,
      startDay: utcDayKey(startsAt),
      endDay: utcDayKey(endsAt),
    }
  })
}

export function decodePersonalEventRows(
  rows: readonly PersonalRow[],
): CalendarEventDecodeResult {
  return decodeRows(rows, (row) => {
    const uid = optionalString(row.uid)
    if (uid === undefined) return "invalid-identity"
    const startsAt = parseDate(row.startsAt)
    if (startsAt === undefined) return "invalid-start"
    const endsAt = parseDate(row.endsAt)
    if (endsAt === undefined) return "invalid-end"
    if (endsAt.getTime() <= startsAt.getTime()) return "non-positive-range"

    return {
      version: 1,
      kind: "timed",
      allDay: false,
      identity: { source: "personal", uid },
      id: uid,
      title: typeof row.title === "string" ? row.title : "",
      color: color(row.color),
      startsAt,
      endsAt,
      location: optionalString(row.location),
      description: optionalString(row.description),
      teachers: [],
      tags: [],
      canceled: false,
      userCalendarId: undefined,
    }
  })
}
