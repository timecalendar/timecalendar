import { fromZonedTime } from "date-fns-tz"

import { dayKey, dayKeyToDate } from "./day-key"
import type { FirstWeekday } from "./week"

/** Whole civil days since 1970-01-01, independent of any zone. */
export type EpochDay = number

const MS_PER_DAY = 86_400_000
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function epochDayOfKey(key: string): EpochDay {
  const match = DAY_KEY_PATTERN.exec(key)
  if (match === null) throw new RangeError(`Invalid day key: ${key}`)
  const [, year, month, day] = match.map(Number) as [
    number,
    number,
    number,
    number,
  ]
  const utc = new Date(Date.UTC(year, month - 1, day))
  if (utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new RangeError(`Invalid day key: ${key}`)
  }
  return utc.getTime() / MS_PER_DAY
}

export function epochDayKey(day: EpochDay): string {
  if (!Number.isSafeInteger(day)) {
    throw new RangeError("EpochDay must be a safe integer")
  }
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10)
}

export function epochDayOfInstant(instant: Date, zone: string): EpochDay {
  return epochDayOfKey(dayKey(instant, zone))
}

/** The first instant of `day` in the display zone. */
export function epochDayStart(day: EpochDay, zone: string): Date {
  const key = epochDayKey(day)
  const midnight = dayKeyToDate(key, zone)
  if (dayKey(midnight, zone) === key) return midnight
  // Zones whose DST gap starts at midnight (America/Santiago, Africa/Cairo,
  // America/Havana) have no 00:00; the day begins when the clock reads 01:00.
  return fromZonedTime(`${key}T01:00:00`, zone)
}

export function weekdayOfEpochDay(day: EpochDay): FirstWeekday {
  return ((((day + 4) % 7) + 7) % 7) as FirstWeekday
}

export function weekStartEpochDay(
  day: EpochDay,
  firstWeekday: FirstWeekday,
): EpochDay {
  return day - ((weekdayOfEpochDay(day) - firstWeekday + 7) % 7)
}
