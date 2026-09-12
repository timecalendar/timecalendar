import { addDaysInZone, dayKey, startOfDayInZone } from "./day-key"

export type FirstWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type WeekDirection = -1 | 1

function weekdayForDayKey(key: string): FirstWeekday {
  const [year, month, day] = key.split("-").map(Number) as [
    number,
    number,
    number,
  ]
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() as FirstWeekday
}

export function startOfWeekInZone(
  date: Date,
  zone: string,
  firstWeekday: FirstWeekday,
): Date {
  const day = startOfDayInZone(date, zone)
  const weekday = weekdayForDayKey(dayKey(day, zone))
  const daysSinceFirstWeekday = (weekday - firstWeekday + 7) % 7
  return addDaysInZone(day, -daysSinceFirstWeekday, zone)
}

export function shiftWeekInZone(
  date: Date,
  direction: WeekDirection,
  zone: string,
  firstWeekday: FirstWeekday,
): Date {
  return addDaysInZone(
    startOfWeekInZone(date, zone, firstWeekday),
    direction * 7,
    zone,
  )
}
