import { addDaysInZone, dayKey, startOfDayInZone } from "./day-key"

export type FirstWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type WeekDirection = -1 | 1

export type WeekColumn = {
  date: Date
  key: string
  weekday: FirstWeekday
  isWeekend: boolean
}

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

export function weekColumns(
  anchor: Date,
  zone: string,
  firstWeekday: FirstWeekday,
  showWeekends: boolean,
): WeekColumn[] {
  const start = startOfWeekInZone(anchor, zone, firstWeekday)
  return Array.from({ length: 7 }, (_, index): WeekColumn => {
    const date = addDaysInZone(start, index, zone)
    const key = dayKey(date, zone)
    const weekday = weekdayForDayKey(key)
    return {
      date,
      key,
      weekday,
      isWeekend: weekday === 0 || weekday === 6,
    }
  }).filter(({ isWeekend }) => showWeekends || !isWeekend)
}
