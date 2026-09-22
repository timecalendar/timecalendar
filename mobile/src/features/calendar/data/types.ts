export type CalendarEventSource = "synced" | "personal"

export interface CalendarEventIdentityV1 {
  source: CalendarEventSource
  uid: string
}

interface CalendarEventBaseV1 {
  version: 1
  identity: CalendarEventIdentityV1
  /** Compatibility alias used by existing Home/Agenda routes. */
  id: string
  title: string | undefined
  /** Validated #RRGGBB surface input. */
  color: string
  location: string | undefined
  description: string | undefined
  teachers: readonly string[]
  tags: readonly string[]
  canceled: boolean
  userCalendarId: string | undefined
}

export interface TimedCalendarEventV1 extends CalendarEventBaseV1 {
  kind: "timed"
  allDay: false
  startsAt: Date
  endsAt: Date
}

export interface DateOnlyCalendarEventV1 extends CalendarEventBaseV1 {
  kind: "date-only"
  allDay: true
  /** Floating Gregorian civil day, YYYY-MM-DD. */
  startDay: string
  /** Exclusive floating Gregorian civil day, YYYY-MM-DD. */
  endDay: string
  /** UTC-midnight compatibility values for existing Home/Agenda formatters. */
  startsAt: Date
  endsAt: Date
}

/** Validated, schema-versioned calendar rendering domain. */
export type CalendarEvent = TimedCalendarEventV1 | DateOnlyCalendarEventV1

export const CALENDAR_EVENT_FALLBACK_COLOR = "#64748B"
