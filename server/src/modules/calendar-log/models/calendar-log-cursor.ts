import { BadRequestException } from "@nestjs/common"

export const CALENDAR_LOG_CURSOR_VERSION = 1

// Postgres renders a `timestamp` as `YYYY-MM-DD HH:MM:SS[.ffffff]`. The `T`
// separator is accepted too so a cursor stays decodable if the driver ever
// renders the ISO form.
const TIMESTAMP_TEXT = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d{1,6})?$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BASE64URL = /^[A-Za-z0-9_-]+$/

// A constant message. It must never echo the submitted cursor or any field
// decoded out of it back to the caller.
const INVALID_CURSOR = "Invalid cursor"

export interface CalendarLogCursor {
  /** The chain's snapshot watermark, as Postgres timestamp text. */
  asOfText: string
  /** The last returned row's `createdAt`, as Postgres timestamp text. */
  createdAtText: string
  /** The last returned row's id. */
  id: string
}

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
}

export const encodeCursor = (cursor: CalendarLogCursor): string => {
  const payload: CursorPayload = {
    v: CALENDAR_LOG_CURSOR_VERSION,
    a: cursor.asOfText,
    c: cursor.createdAtText,
    i: cursor.id,
  }

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

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
  if (!BASE64URL.test(value)) throw new BadRequestException(INVALID_CURSOR)

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
  } catch {
    throw new BadRequestException(INVALID_CURSOR)
  }

  if (!isRecord(payload)) throw new BadRequestException(INVALID_CURSOR)
  if (payload.v !== CALENDAR_LOG_CURSOR_VERSION) {
    throw new BadRequestException(INVALID_CURSOR)
  }

  const { a, c, i } = payload
  if (typeof a !== "string" || !TIMESTAMP_TEXT.test(a)) {
    throw new BadRequestException(INVALID_CURSOR)
  }
  if (typeof c !== "string" || !TIMESTAMP_TEXT.test(c)) {
    throw new BadRequestException(INVALID_CURSOR)
  }
  if (typeof i !== "string" || !UUID.test(i)) {
    throw new BadRequestException(INVALID_CURSOR)
  }

  return { asOfText: a, createdAtText: c, id: i }
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
