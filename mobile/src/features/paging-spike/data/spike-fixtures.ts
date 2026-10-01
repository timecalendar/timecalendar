export const MINUTES_PER_DAY = 24 * 60
export const MIN_PIXELS_PER_HOUR = 40
export const MAX_PIXELS_PER_HOUR = 120
export const DEFAULT_PIXELS_PER_HOUR = 60
export const MAX_CONTENT_HEIGHT = 24 * MAX_PIXELS_PER_HOUR

const MS_PER_DAY = 86_400_000
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export type SpikeEvent = {
  key: string
  startMinute: number
  durationMinutes: number
  column: number
  lane: number
  laneCount: number
  title: string
  location: string
}

export type SpikeDay = {
  epochDay: number
  weekday: string
  dayOfMonth: number
  isToday: boolean
}

export const todayEpochDay = (now = new Date()) =>
  Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / MS_PER_DAY)

// Epoch day 0 is a Thursday; week pages start on Monday.
export const weekStartDay = (epochDay: number) =>
  epochDay - ((((epochDay + 3) % 7) + 7) % 7)

export const pageStartDay = (pageIndex: number) => pageIndex * 7 - 3

export const pageIndexOfDay = (epochDay: number) =>
  (weekStartDay(epochDay) + 3) / 7

export const isoDate = (epochDay: number) =>
  new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10)

export const pageDays = (pageIndex: number, today: number): SpikeDay[] =>
  WEEKDAYS.map((weekday, column) => {
    const epochDay = pageStartDay(pageIndex) + column
    return {
      epochDay,
      weekday,
      dayOfMonth: new Date(epochDay * MS_PER_DAY).getUTCDate(),
      isToday: epochDay === today,
    }
  })

const SLOTS = [
  { start: 8 * 60, duration: 120, title: "Algorithms", location: "B204" },
  {
    start: 10 * 60 + 15,
    duration: 105,
    title: "Linear algebra",
    location: "A1",
  },
  {
    start: 13 * 60 + 30,
    duration: 120,
    title: "Databases lab",
    location: "C3",
  },
  { start: 16 * 60, duration: 90, title: "English", location: "D12" },
]

const hash = (value: number) => Math.imul(value ^ 0x9e3779b9, 0x85ebca6b) >>> 0

export const pageEvents = (pageIndex: number): SpikeEvent[] => {
  const events: SpikeEvent[] = []
  for (let column = 0; column < 5; column += 1) {
    const epochDay = pageStartDay(pageIndex) + column
    const seed = hash(epochDay)
    SLOTS.forEach((slot, index) => {
      if ((seed >> index) % 5 === 0) return
      events.push({
        key: `${epochDay}:${index}`,
        startMinute: slot.start + ((seed >> (index + 4)) % 3) * 15,
        durationMinutes: slot.duration,
        column,
        lane: 0,
        laneCount: 1,
        title: slot.title,
        location: slot.location,
      })
    })
    if (column === 2) {
      events.push(
        {
          key: `${epochDay}:overlap-a`,
          startMinute: 18 * 60,
          durationMinutes: 120,
          column,
          lane: 0,
          laneCount: 2,
          title: "Seminar",
          location: "Amphi",
        },
        {
          key: `${epochDay}:overlap-b`,
          startMinute: 19 * 60,
          durationMinutes: 90,
          column,
          lane: 1,
          laneCount: 2,
          title: "Club",
          location: "Hall",
        },
      )
    }
  }
  return events
}
