import { BadRequestException } from "@nestjs/common"

export const LEGACY_CALENDAR_LOG_CURSOR_VERSION = 1
export const CALENDAR_LOG_CURSOR_VERSION = 2

// Postgres renders a `timestamp` as `YYYY-MM-DD HH:MM:SS[.ffffff]`. The `T`
// separator is accepted too so a cursor stays decodable if the driver ever
// renders the ISO form.
const TIMESTAMP_TEXT = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BASE64URL = /^[A-Za-z0-9_-]+$/

// A constant message. It must never echo the submitted cursor or any field
// decoded out of it back to the caller.
const INVALID_CURSOR = "Invalid cursor"

export const invalidCalendarLogCursor = (): BadRequestException =>
  new BadRequestException(INVALID_CURSOR)

export interface CalendarLogCursor {
  version: 1 | 2
  /** The chain's snapshot watermark, as Postgres timestamp text. */
  asOfText: string
  /** The last returned row's `createdAt`, as Postgres timestamp text. */
  createdAtText: string
  /** The last returned row's id. */
  id: string
  /** Exact next atomic-change position. Version 1 always decodes to zero. */
  offset: number
}

export const isFragmentResumeCursor = (
  cursor: CalendarLogCursor | null | undefined,
): cursor is CalendarLogCursor & { version: 2 } =>
  cursor?.version === CALENDAR_LOG_CURSOR_VERSION && cursor.offset > 0

/**
 * The wire payload is deliberately terse and positional-free: a version plus
 * the three anchor fields, and nothing derived from a token, a calendar, or
 * event content.
 */
interface CursorPayload {
  v: number
  a: string
  c: string
  i: string
  o: number
}

export const encodeCursor = (cursor: CalendarLogCursor): string => {
  const payload: CursorPayload = {
    v: CALENDAR_LOG_CURSOR_VERSION,
    a: cursor.asOfText,
    c: cursor.createdAtText,
    i: cursor.id,
    o: cursor.offset,
  }

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isTimestampText = (value: string): boolean => {
  if (!TIMESTAMP_TEXT.test(value)) return false

  const [date, time] = value.split(/[ T]/)
  const [year, month, day] = date.split("-").map(Number)
  const [hour, minute, second] = time.split(/[.:]/).map(Number)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59
  )
}

/**
 * Narrows one decoded field to a string matching `pattern`, or rejects the whole
 * cursor. Every anchor field goes through here, so none can reach SQL without
 * having been format-checked.
 */
const anchorField = (value: unknown, pattern: RegExp): string => {
  if (typeof value !== "string" || !pattern.test(value)) {
    throw invalidCalendarLogCursor()
  }
  return value
}

const timestampField = (value: unknown): string => {
  if (typeof value !== "string" || !isTimestampText(value)) {
    throw invalidCalendarLogCursor()
  }
  return value
}

/**
 * Decodes and *fully* validates a client-supplied cursor. Every field is
 * checked against a strict format before any of it can reach SQL, so a forged
 * cursor cannot smuggle a fragment into a query even though the values are
 * bound as parameters.
 *
 * The cursor is not signed: it holds no secret and grants no access. Every page
 * re-authorizes against the `tokens` in the same request body, so a forged
 * cursor can only move the window inside data the caller could already read.
 */
export const decodeCursor = (value: string): CalendarLogCursor => {
  if (!BASE64URL.test(value)) throw invalidCalendarLogCursor()

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
  } catch {
    throw invalidCalendarLogCursor()
  }

  if (!isRecord(payload)) throw invalidCalendarLogCursor()
  if (
    payload.v !== LEGACY_CALENDAR_LOG_CURSOR_VERSION &&
    payload.v !== CALENDAR_LOG_CURSOR_VERSION
  ) {
    throw invalidCalendarLogCursor()
  }

  const offset =
    payload.v === LEGACY_CALENDAR_LOG_CURSOR_VERSION ? 0 : payload.o
  if (!Number.isSafeInteger(offset) || (offset as number) < 0) {
    throw invalidCalendarLogCursor()
  }

  return {
    version: payload.v,
    asOfText: timestampField(payload.a),
    createdAtText: timestampField(payload.c),
    id: anchorField(payload.i, UUID),
    offset: offset as number,
  }
}

/**
 * Converts Postgres timestamp text to a `Date` for the response wire format.
 *
 * The fraction is truncated to milliseconds explicitly rather than relying on
 * the engine's lenient parse of a 6-digit fraction, and the DB session and this
 * process both run UTC (see `CalendarLogRepository.getSnapshotTime`), so the
 * naive text denotes a UTC instant. Only the response's `asOf` goes through
 * here — the cursor and every query predicate keep the full-precision text.
 */
export const timestampTextToDate = (text: string): Date => {
  const [datePart, timePart] = text.split(/[ T]/)
  const [seconds, fraction = ""] = timePart.split(".")
  return new Date(
    `${datePart}T${seconds}.${fraction.padEnd(3, "0").slice(0, 3)}Z`,
  )
}
