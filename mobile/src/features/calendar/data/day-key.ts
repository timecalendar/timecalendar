import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"

// The display-zone calendar day of an instant as a `YYYY-MM-DD` string — the
// machine day-key for TIMED events (NOT locale-aware display; formatting is
// `format.ts`'s job). Zone-aware so a 23:30 instant keys on the DISPLAY zone's
// own day, wherever the device is. Shared by the agenda's per-day bucketing
// (`groupEventsByDay`), the calendar grid's `initialDate`, and the home
// selectors — every "which display day is this" question.
export function dayKey(date: Date, zone: string): string {
  return formatInTimeZone(date, zone, "yyyy-MM-dd")
}

// The instant of a day-key's midnight in the display zone. A non-existent date
// (e.g. 2026-02-31) yields an Invalid Date, which is how `parseFocusDate`
// rejects it.
export function dayKeyToDate(key: string, zone: string): Date {
  return fromZonedTime(`${key}T00:00:00`, zone)
}

// The instant of the display zone's midnight for the day containing `date`.
export function startOfDayInZone(date: Date, zone: string): Date {
  return dayKeyToDate(dayKey(date, zone), zone)
}

// Shift by whole calendar days on the zone's wall clock (DST-safe: the shifted
// proxy Date carries wall-clock fields; re-interpreting it in the zone absorbs
// an offset change instead of drifting the local midnight by an hour).
export function addDaysInZone(date: Date, days: number, zone: string): Date {
  const proxy = toZonedTime(date, zone)
  proxy.setDate(proxy.getDate() + days)
  return fromZonedTime(proxy, zone)
}

// The instant of `hour` o'clock (wall clock) on `day`'s zone calendar day.
export function atHourInZone(day: Date, hour: number, zone: string): Date {
  const proxy = toZonedTime(day, zone)
  proxy.setHours(hour, 0, 0, 0)
  return fromZonedTime(proxy, zone)
}

// The zone wall-clock minute-of-day of an instant (bucketing/positioning math;
// display formatting stays in format.ts).
export function minuteOfDayInZone(date: Date, zone: string): number {
  const proxy = toZonedTime(date, zone)
  return proxy.getHours() * 60 + proxy.getMinutes()
}

// The UTC calendar day of a `Date` as `YYYY-MM-DD` — the all-day key. An all-day
// event is a FLOATING date (May 25 is May 25 in every timezone), stored as UTC
// midnight; keying it off a zone's day would shift it a day for a UTC-negative
// zone. So the grid all-day lane reads the day off UTC, not the display zone
// (the timed grid keys on the display zone — `dayKey`). Mirrors the all-day
// formatting in `format.ts`.
export function utcDayKey(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
